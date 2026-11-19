import '../styles/OrderStatus.css';

const STEPS = [
  { key: 'kitchen', label: 'In Kitchen Prep', stepNumber: '1', activeIcon: '👨‍🍳' },
  { key: 'ready', label: 'Ready for Seat', stepNumber: '2', activeIcon: '🍿' },
  { key: 'delivered', label: 'Delivered to Seat', stepNumber: '3', activeIcon: '🎉' },
];

export default function OrderStatus({ status }) {
  const normalized = status?.toLowerCase() || 'confirmed';
  const isDelivered = normalized === 'delivered';
  const isReady = normalized === 'ready';

  return (
    <div className="order-status">
      <div className="order-status__track">
        {STEPS.map((step, index) => {
          let isCompleted = false;
          let isCurrent = false;

          if (isDelivered) {
            isCompleted = true;
          } else if (isReady) {
            if (index === 0) isCompleted = true;
            if (index === 1) isCurrent = true;
          } else {
            // confirmed or preparing
            if (index === 0) isCurrent = true;
          }

          const isPending = !isCompleted && !isCurrent;
          const isReadyActive = isCurrent && isReady;

          return (
            <div
              key={step.key}
              className={`order-status__step ${
                isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
              } ${isReadyActive ? 'ready-active' : ''}`}
            >
              {index > 0 && (
                <div
                  className={`order-status__connector ${
                    isCompleted || isCurrent ? 'active' : ''
                  } ${isReadyActive ? 'connector-ready' : ''}`}
                />
              )}

              <div className="order-status__icon-wrapper">
                <div
                  className={`order-status__icon ${
                    isCompleted ? 'icon-completed' : ''
                  } ${isReadyActive ? 'icon-ready' : ''}`}
                >
                  {isCompleted ? '✓' : isCurrent ? (isReadyActive ? '🍿' : '1') : step.stepNumber}
                </div>
                {isCurrent && (
                  <div
                    className={`order-status__pulse ${
                      isReadyActive ? 'pulse-ready' : ''
                    }`}
                  />
                )}
              </div>

              <span className={`order-status__label ${isCurrent ? 'label-current' : ''} ${isCompleted ? 'label-completed' : ''}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
