import { ReactNode } from "react";

export function MetricCard(props: {
  label: string;
  value: string;
  detail: string;
  accent?: ReactNode;
}) {
  return (
    <article className="panel metric-card metric-card-upgraded">
      <div className="metric-head">
        <p className="eyebrow">{props.label}</p>
        {props.accent}
      </div>
      <h3>{props.value}</h3>
      <p className="muted">{props.detail}</p>
    </article>
  );
}
