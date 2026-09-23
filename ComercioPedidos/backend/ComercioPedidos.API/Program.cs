using ComercioPedidos.API.Exceptions;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using ComercioPedidos.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Base de datos
builder.Services.AddDbContext<ComercioPedidosDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("ComercioPedidos")));

// Manejo global de excepciones
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Servicios
builder.Services.AddScoped<IProductoService, ProductoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Manejo global de excepciones
app.UseExceptionHandler();

// Swagger solo en desarrollo
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();

////Program.cs

//1. Crear aplicación
//        ↓
//2. Configurar base de datos
//        ↓
//3. Configurar excepciones
//        ↓
//4. Registrar nuestros Services
//        ↓
//5. Registrar Controllers
//        ↓
//6. Configurar Swagger
//        ↓
//7. Construir aplicación
//        ↓
//8. Configurar middleware
//        ↓
//9. Mapear Controllers
//        ↓
//10. Ejecutar