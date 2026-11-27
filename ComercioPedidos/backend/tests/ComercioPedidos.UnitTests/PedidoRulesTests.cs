using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Enums;
using ComercioPedidos.Application.Exceptions;
using ComercioPedidos.Application.Rules;
using System.ComponentModel.DataAnnotations;

namespace ComercioPedidos.UnitTests;

public sealed class PedidoRulesTests
{
    [Theory]
    [InlineData("0.10", 3, "0.30")]
    [InlineData("18500.25", 2, "37000.50")]
    public void TotalesUsanDecimalesExactos(string price, int quantity, string expected) => Assert.Equal(decimal.Parse(expected, System.Globalization.CultureInfo.InvariantCulture), PedidoRules.Subtotal(decimal.Parse(price, System.Globalization.CultureInfo.InvariantCulture), quantity));

    [Theory]
    [InlineData(0, 1)] [InlineData(-1, 1)] [InlineData(1, 0)] [InlineData(1, -1)]
    public void RechazaImportesOCantidadesInvalidas(int price, int quantity) => Assert.Throws<ReglaNegocioException>(() => PedidoRules.Subtotal(price, quantity));

    [Fact]
    public void RechazaFraccionesDeCentavoYTotalesFueraDeRango()
    {
        Assert.Throws<ReglaNegocioException>(() => PedidoRules.Subtotal(0.001m, 1));
        Assert.Throws<ReglaNegocioException>(() => PedidoRules.Subtotal(PedidoRules.ImporteMaximo, 2));
    }

    [Theory]
    [InlineData(EstadoPedido.Pendiente, EstadoPedido.Confirmado)]
    [InlineData(EstadoPedido.Pendiente, EstadoPedido.Cancelado)]
    [InlineData(EstadoPedido.Confirmado, EstadoPedido.Cancelado)]
    [InlineData(EstadoPedido.Confirmado, EstadoPedido.Entregado)]
    public void TransicionesPermitidas(EstadoPedido actual, EstadoPedido siguiente) => PedidoRules.ValidarTransicion(actual, siguiente);

    [Theory]
    [InlineData(EstadoPedido.Pendiente, EstadoPedido.Entregado)]
    [InlineData(EstadoPedido.Cancelado, EstadoPedido.Confirmado)]
    [InlineData(EstadoPedido.Cancelado, EstadoPedido.Cancelado)]
    [InlineData(EstadoPedido.Entregado, EstadoPedido.Cancelado)]
    [InlineData(EstadoPedido.Confirmado, EstadoPedido.Confirmado)]
    public void TransicionesInvalidasSonConflictos(EstadoPedido actual, EstadoPedido siguiente) => Assert.Throws<ConflictoException>(() => PedidoRules.ValidarTransicion(actual, siguiente));

    [Fact]
    public void AgrupaProductosRepetidosSinPerderCantidades()
    {
        var details = PedidoRules.NormalizarDetalles(new CrearPedidoDto { ClienteId = 1, Detalles = [new() { ProductoId = 2, Cantidad = 2 }, new() { ProductoId = 2, Cantidad = 3 }] });
        Assert.Single(details); Assert.Equal(5, details[0].Cantidad);
    }

    [Fact]
    public void CantidadAgregadaNoPuedeDesbordar()
    {
        Assert.Throws<ReglaNegocioException>(() => PedidoRules.NormalizarDetalles(new CrearPedidoDto { ClienteId = 1, Detalles = [new() { ProductoId = 1, Cantidad = int.MaxValue }, new() { ProductoId = 1, Cantidad = 1 }] }));
        Assert.Throws<ReglaNegocioException>(() => PedidoRules.NormalizarDetalles(new CrearPedidoDto { ClienteId = 1, Detalles = [null!] }));
    }

    [Fact]
    public void ValidacionDtoLimitaPrecioCantidadTelefonoYElementosNulos()
    {
        object[] invalid = [new CrearProductoDto { Nombre = "Producto", Precio = 1.001m }, new RegistrarEntradaStockDto { ProductoId = 0, Cantidad = 1 }, new CrearClienteDto { Nombre = "Cliente", Apellido = "Demo", Email = "demo@example.com", Telefono = new string('1', 31) }, new CrearPedidoDto { ClienteId = 1, Detalles = [null!] }];
        foreach (var dto in invalid) Assert.False(Validator.TryValidateObject(dto, new ValidationContext(dto), [], true));
    }
}
