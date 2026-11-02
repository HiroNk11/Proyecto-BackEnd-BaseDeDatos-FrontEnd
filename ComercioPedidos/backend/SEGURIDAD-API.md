# Acceso a la API

La API ya no admite operaciones anonimas. Si falta configuracion de acceso,
el servidor no inicia: no hay usuario, password ni token predeterminado.

## Produccion

Configurar en el servidor, no en archivos versionados:

```text
Authentication__Authority=https://IDENTIDAD-DEL-OPERADOR
Authentication__Audience=IDENTIFICADOR-DE-ESTA-API
Authentication__RoleClaimType=role
Cors__AllowedOrigins__0=https://DOMINIO-REAL-DE-LA-WEB
AllowedHosts=DOMINIO-REAL-DE-LA-API
ConnectionStrings__ComercioPedidos=CADENA-PRIVADA-DEL-SERVIDOR
```

Usar un proveedor OAuth/OIDC con metadata HTTPS y access tokens firmados RS256 o
ES256, audiencia correcta, expiracion, sujeto `sub` no vacio y roles asignados por
el servidor de identidad. No crear un generador propio de tokens en el cliente.
Se exige HTTPS en la API y cifrado con certificado valido en SQL de produccion.
Este cambio no configura automaticamente un proveedor ni despliega el servidor.

## Permisos

| Rol | Consultar | Crear/actualizar y transiciones | Eliminar |
| --- | --- | --- | --- |
| Consulta | Si | No | No |
| Operador | Si | Si | No |
| Administrador | Si | Si | Si |

La politica por defecto tambien exige acceso para futuras rutas. Los rechazos
usan 401 sin token valido y 403 cuando faltan permisos. Swagger en Development
documenta Bearer y no contiene tokens.

## Clientes web y movil

El cliente debe obtener un access token del proveedor mediante el flujo apropiado
(OIDC Authorization Code con PKCE para clientes publicos) y enviarlo como Bearer.
No incluir client secrets en React, React Native, VITE_* ni EXPO_PUBLIC_*.

**Cambio incompatible intencional:** los clientes actuales aun no integran un
proveedor de inicio de sesion y recibiran 401 hasta hacerlo. No agregar un bypass
anonimo para recuperar el comportamiento anterior. Mantener este PR en revision
hasta acordar el proveedor y la integracion del cliente antes de un despliegue.

## Pruebas locales

Development escucha solo en loopback, respetando los perfiles de lanzamiento
o `ASPNETCORE_URLS` (puerto HTTP 5272 si no se configura). Para pruebas automatizadas se admite un issuer y una clave HS256
de al menos 64 bytes solo en Development. La suite genera una clave aleatoria en
memoria, no la guarda ni la muestra, y no requiere SQL Server:

```powershell
dotnet build ComercioPedidos/backend/ComercioPedidos.slnx -c Release
python ComercioPedidos/backend/tests/security_http.py
```

No reutilizar claves de pruebas ni publicarlas. La verificacion offline cubre
politicas y validacion JWT, no equivale a probar un proveedor OIDC real.
