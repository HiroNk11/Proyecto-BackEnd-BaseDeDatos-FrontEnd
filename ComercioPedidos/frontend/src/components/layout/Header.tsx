function Header() {
  return (
    <header className="header">
      <div>
        <h1>Panel de gestión</h1>
        <p>Administración de clientes, productos y pedidos</p>
      </div>

      <div className="header-user">
        <div className="user-avatar">
          CP
        </div>

        <div>
          <strong>Administrador</strong>
          <span>Sistema ComercioPedidos</span>
        </div>
      </div>
    </header>
  );
}

export default Header;