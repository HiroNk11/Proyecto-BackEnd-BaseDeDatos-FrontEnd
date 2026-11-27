using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComercioPedidos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CicloPedidosAuditoriaStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MovimientosStock_ProductoId",
                table: "MovimientosStock");

            migrationBuilder.AddColumn<int>(
                name: "StockMinimo",
                table: "Productos",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Productos",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Pedidos",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "TipoMovimiento",
                table: "MovimientosStock",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioId",
                table: "MovimientosStock",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "HistorialEstadosPedidos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    EstadoAnterior = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    EstadoNuevo = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    FechaUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistorialEstadosPedidos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistorialEstadosPedidos_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_ProductoId_Fecha_Id",
                table: "MovimientosStock",
                columns: new[] { "ProductoId", "Fecha", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_HistorialEstadosPedidos_PedidoId_FechaUtc_Id",
                table: "HistorialEstadosPedidos",
                columns: new[] { "PedidoId", "FechaUtc", "Id" });
            // Preserve existing audit rows without inventing an actor or a past transition.
            migrationBuilder.Sql("""
                UPDATE Productos SET Version = NEWID();
                UPDATE Pedidos SET Version = NEWID();
                UPDATE MovimientosStock SET UsuarioId = 'historico-desconocido',
                    TipoMovimiento = CASE WHEN PedidoId IS NOT NULL AND Tipo = 'Salida' THEN 'ReservaPorPedido'
                        WHEN PedidoId IS NOT NULL AND Tipo = 'Entrada' THEN 'LiberacionPorCancelacion'
                        WHEN Tipo = 'Entrada' THEN 'Ingreso' ELSE 'AjusteManual' END;
                INSERT INTO HistorialEstadosPedidos (PedidoId, EstadoAnterior, EstadoNuevo, FechaUtc, UsuarioId)
                    SELECT Id, NULL, Estado, SYSUTCDATETIME(), 'migracion-snapshot' FROM Pedidos;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistorialEstadosPedidos");

            migrationBuilder.DropIndex(
                name: "IX_MovimientosStock_ProductoId_Fecha_Id",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "StockMinimo",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "TipoMovimiento",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "MovimientosStock");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_ProductoId",
                table: "MovimientosStock",
                column: "ProductoId");
        }
    }
}
