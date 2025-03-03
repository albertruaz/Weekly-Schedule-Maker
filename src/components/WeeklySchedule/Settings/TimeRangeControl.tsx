import { Component, For } from "solid-js";
import styles from "./Settings.module.css";

interface TimeRangeControlProps {
  startHour: () => number;
  endHour: () => number;
  setStartHour: (hour: number) => void;
  setEndHour: (hour: number) => void;
}

export const TimeRangeControl: Component<TimeRangeControlProps> = (props) => {
  const startOptions = Array.from({ length: 11 }, (_, i) => i + 4); // 4~14
  const endOptions = Array.from({ length: 13 }, (_, i) => i + 15); // 15~27

  return (
    <div class={styles.timeRangeControl}>
      <div class={styles.timeRangeSelect}>
        <select
          value={props.startHour()}
          onChange={(e) => props.setStartHour(Number(e.target.value))}
        >
          <For each={startOptions}>
            {(hour) => (
              <option value={hour}>
                {hour > 12 ? `오후 ${hour - 12}` : `오전 ${hour}`}
              </option>
            )}
          </For>
        </select>
        <span class={styles.timeRangeSeparator}>~</span>
        <select
          value={props.endHour()}
          onChange={(e) => props.setEndHour(Number(e.target.value))}
        >
          <For each={endOptions}>
            {(hour) => (
              <option value={hour}>
                {hour > 12 ? `오후 ${hour - 12}` : `오전 ${hour}`}
              </option>
            )}
          </For>
        </select>
      </div>
    </div>
  );
};
