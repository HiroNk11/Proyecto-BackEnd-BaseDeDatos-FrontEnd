"""Offline HTTP authorization checks; no SQL connection or persistent test user."""
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DOTNET = os.environ.get('SECURITY_DOTNET', 'dotnet')
DLL = ROOT / 'ComercioPedidos.API/bin/Release/net10.0/ComercioPedidos.API.dll'
KEY = secrets.token_hex(64)
checks = 0

def check(condition, message):
    global checks
    if not condition:
        raise AssertionError(message)
    checks += 1

def token(role='Consulta', **changes):
    claims = dict(iss='security-tests', aud='comercio-tests', sub='synthetic-user',
                  exp=int(time.time()) + 300, role=role)
    claims.update(changes)
    def encode(value):
        return base64.urlsafe_b64encode(json.dumps(value).encode()).rstrip(b'=')
    data = encode(dict(alg='HS256', typ='JWT')) + b'.' + encode(claims)
    signature = base64.urlsafe_b64encode(hmac.new(KEY.encode(), data, hashlib.sha256).digest()).rstrip(b'=')
    return (data + b'.' + signature).decode()

def environment(port, **changes):
    env = {k: v for k, v in os.environ.items() if not k.startswith(('Authentication__', 'ConnectionStrings__', 'Kestrel__', 'ASPNETCORE_', 'DOTNET_ENVIRONMENT'))}
    env.update(ASPNETCORE_ENVIRONMENT='Development', ASPNETCORE_URLS='http://127.0.0.1:' + str(port),
               Authentication__Audience='comercio-tests', Authentication__Issuer='security-tests',
               Authentication__SigningKey=KEY,
               ConnectionStrings__ComercioPedidos='Server=127.0.0.1,1;Database=NoData;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;Connect Timeout=1;')
    env.update(changes)
    return env

def launch(env):
    return subprocess.Popen([DOTNET, str(DLL), '--contentRoot', str(ROOT / 'ComercioPedidos.API')],
                            env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def terminate(process):
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=8)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)

with socket.socket() as listener:
    listener.bind(('127.0.0.1', 0))
    port = listener.getsockname()[1]

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
def request(path, method='GET', credential=None, body=None):
    headers = {'Content-Type': 'application/json'}
    if credential:
        headers['Authorization'] = 'Bearer ' + credential
    req = urllib.request.Request('http://127.0.0.1:' + str(port) + path, method=method, data=body, headers=headers)
    try:
        with opener.open(req, timeout=5) as response:
            return response.status, response.headers, response.read()
    except urllib.error.HTTPError as response:
        return response.code, response.headers, response.read()

for changes, expected_error in (
    ({'Authentication__SigningKey': ''}, '64 bytes'),
    ({'Authentication__Authority': 'http://identity.example.invalid'}, 'URL HTTPS'),
    ({'ASPNETCORE_ENVIRONMENT': 'Production'}, 'Authority HTTPS'),
    ({'ASPNETCORE_URLS': 'http://0.0.0.0:5272'}, 'loopback'),
    ({'Cors__AllowedOrigins__0': '*'}, 'CORS explicitos'),
):
    process = subprocess.Popen([DOTNET, str(DLL), '--contentRoot', str(ROOT / 'ComercioPedidos.API')],
                               env=environment(port, **changes), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        try:
            output, error = process.communicate(timeout=4)
        except subprocess.TimeoutExpired:
            # Windows Error Reporting can delay exit after an unhandled startup exception.
            process.kill()
            output, error = process.communicate(timeout=5)
        check(process.returncode != 0 and expected_error in (output + error).decode(errors='replace'),
              'Invalid authentication configuration must fail startup for the expected reason')
    finally:
        terminate(process)

process = launch(environment(port))
try:
    for _ in range(100):
        if process.poll() is not None:
            raise RuntimeError('API stopped before security tests')
        try:
            if request('/api/Clientes')[0] == 401:
                break
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(.1)
    else:
        raise RuntimeError('API did not start')
    for path in ('/api/Clientes', '/api/Productos', '/api/Pedidos', '/api/movimientos-stock'):
        check(request(path)[0] == 401, 'Anonymous read must be rejected: ' + path)
    for path in ('/api/Clientes', '/api/Productos', '/api/Pedidos', '/api/movimientos-stock/entrada', '/api/movimientos-stock/salida'):
        check(request(path, 'POST', body=b'{')[0] == 401, 'Anonymous write must be rejected')
        check(request(path, 'POST', token('Consulta'), b'{')[0] == 403, 'Consulta must not write')
        check(request(path, 'POST', token('Operador'), b'{')[0] == 400, 'Operador should reach validation, not SQL')
    for role in ('Consulta', 'Operador'):
        check(request('/api/Clientes/not-an-id', 'DELETE', token(role))[0] == 403, 'Non-admin must not delete')
    check(request('/api/Clientes/not-an-id', 'DELETE', token('Administrador'))[0] == 400, 'Admin reaches validation')
    check(request('/api/Productos/not-an-id', credential=token())[0] == 400, 'Consulta can reach read validation')
    for credential in ('invalid', token(aud='other'), token(iss='other'), token(exp=int(time.time()) - 120)):
        check(request('/api/Clientes', credential=credential)[0] == 401, 'Invalid JWT must be rejected')
    check(request('/api/Clientes', credential=token()[:-8] + 'AAAAAAAA')[0] == 401, 'Invalid signature must be rejected')
    check(request('/api/Clientes', credential=token('Unrecognized'))[0] == 403, 'Unknown role must be rejected')
    check(request('/api/Clientes', credential=token(sub=''))[0] == 403, 'Empty subject must be rejected')
    check(request('/api/new-endpoint')[0] == 401, 'Fallback must protect future routes')
    status, headers, _ = request('/api/Clientes')
    check(headers.get('Cache-Control') == 'no-store', 'Sensitive responses must not be cached')
    check(headers.get('X-Content-Type-Options') == 'nosniff', 'Security header missing')
    status, _, body = request('/swagger/v1/swagger.json')
    schema = json.loads(body)
    check(status == 200 and 'Bearer' in schema['components']['securitySchemes'], 'Swagger must document Bearer')
    print('OK: ' + str(checks) + ' authentication/authorization checks; no database writes.')
finally:
    terminate(process)
