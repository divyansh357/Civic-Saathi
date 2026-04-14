const modules = [
  'Dashboard',
  'Complaints',
  'Departments',
  'Workers',
  'Users',
  'Analytics',
  'Notifications'
];

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Civic Saathi Admin Dashboard</h1>
        <p>Base web shell initialized. Connect routes and module pages incrementally.</p>
      </header>

      <section className="module-grid">
        {modules.map(moduleName => (
          <article className="module-card" key={moduleName}>
            <h2>{moduleName}</h2>
            <p>{moduleName} module scaffold is ready for feature wiring.</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default App;
