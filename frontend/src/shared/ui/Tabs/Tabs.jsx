import {
  classNames,
} from '../internal/classNames';

import './Tabs.css';

function Tabs({
  activeId,
  ariaLabel = 'Vistas disponibles',
  className,
  onChange,
  tabs = [],
}) {
  const enabledTabs = tabs.filter((tab) => !tab.disabled);

  const moveFocus = (currentId, direction) => {
    if (enabledTabs.length === 0) return;

    const currentIndex = enabledTabs.findIndex(
      (tab) => tab.id === currentId,
    );
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex =
      (startIndex + direction + enabledTabs.length) %
      enabledTabs.length;
    const nextTab = enabledTabs[nextIndex];

    onChange?.(nextTab.id);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`${nextTab.id}-tab`)
        ?.focus();
    });
  };

  const focusBoundary = (position) => {
    const nextTab = position === 'first'
      ? enabledTabs[0]
      : enabledTabs[enabledTabs.length - 1];

    if (!nextTab) return;

    onChange?.(nextTab.id);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`${nextTab.id}-tab`)
        ?.focus();
    });
  };

  return (
    <div
      className={classNames('ui-tabs', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;

        return (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            type="button"
            className={classNames(
              'ui-tabs__tab',
              {
                'ui-tabs__tab--active': selected,
              },
            )}
            role="tab"
            aria-selected={selected}
            aria-controls={tab.panelId}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange?.(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveFocus(tab.id, 1);
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveFocus(tab.id, -1);
              } else if (event.key === 'Home') {
                event.preventDefault();
                focusBoundary('first');
              } else if (event.key === 'End') {
                event.preventDefault();
                focusBoundary('last');
              }
            }}
          >
            {tab.icon && (
              <i
                className={tab.icon}
                aria-hidden="true"
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ui-tabs__count">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
