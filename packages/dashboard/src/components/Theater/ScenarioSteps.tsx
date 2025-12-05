import { Scenario } from './index';
import styles from './Theater.module.css';

interface ScenarioStepsProps {
  scenario: Scenario | null;
  currentStep: number;
}

export function ScenarioSteps({ scenario, currentStep }: ScenarioStepsProps) {
  if (!scenario) {
    return (
      <div className={styles.scenarioSteps}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Scenario Steps</h3>
        </div>
        <div className={styles.emptySteps}>
          <div className={styles.emptyStepsIcon}>📋</div>
          <div className={styles.emptyStepsText}>No scenario loaded</div>
          <div className={styles.emptyStepsSubtext}>
            Select a scenario to see its steps
          </div>
        </div>
      </div>
    );
  }

  const getStepIcon = (step: Scenario['steps'][0], index: number) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className={`${styles.stepIcon} ${styles.stepIconCompleted}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className={`${styles.stepIcon} ${styles.stepIconFailed}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'running':
        return (
          <div className={`${styles.stepIcon} ${styles.stepIconRunning}`}>
            <div className={styles.stepIconSpinner} />
          </div>
        );
      default:
        return (
          <div className={`${styles.stepIcon} ${styles.stepIconPending}`}>
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className={styles.scenarioSteps}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Scenario Steps</h3>
        <div className={styles.scenarioName}>{scenario.name}</div>
      </div>

      <div className={styles.stepsList}>
        {scenario.steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;
          const isFuture = index > currentStep;

          return (
            <div
              key={step.id}
              className={`
                ${styles.stepItem}
                ${isCurrent ? styles.stepItemCurrent : ''}
                ${isPast ? styles.stepItemPast : ''}
                ${isFuture ? styles.stepItemFuture : ''}
                ${step.status === 'failed' ? styles.stepItemFailed : ''}
                ${step.status === 'completed' ? styles.stepItemCompleted : ''}
              `}
            >
              {getStepIcon(step, index)}
              <div className={styles.stepContent}>
                <div className={styles.stepDescription}>{step.description}</div>
                {step.status === 'running' && (
                  <div className={styles.stepStatus}>In progress...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.stepsProgress}>
        <div className={styles.progressText}>
          {scenario.steps.filter((s) => s.status === 'completed').length} of{' '}
          {scenario.steps.length} completed
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${
                (scenario.steps.filter((s) => s.status === 'completed').length /
                  scenario.steps.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
