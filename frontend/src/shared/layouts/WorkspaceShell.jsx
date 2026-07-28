import {
  classNames,
} from '../ui/internal/classNames';

import './workspace-shell.css';

function WorkspaceShell({
  children,
  className,
  footer,
  sidebar,
}) {
  return (
    <section
      className={classNames(
        'workspace-shell',
        className,
      )}
    >
      {sidebar && (
        <aside className="workspace-shell__sidebar">
          {sidebar}
        </aside>
      )}

      <div className="workspace-shell__content">
        {children}
      </div>

      {footer && (
        <footer className="workspace-shell__footer">
          {footer}
        </footer>
      )}
    </section>
  );
}

export default WorkspaceShell;
