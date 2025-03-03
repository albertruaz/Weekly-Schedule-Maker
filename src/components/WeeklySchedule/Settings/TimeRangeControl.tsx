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

  const formatHour = (hour: number) => {
    const adjustedHour = hour >= 24 ? hour - 24 : hour;
    if (adjustedHour === 0) {
      return "자정 12";
    } else if (adjustedHour === 12) {
      return "정오 12";
    } else if (adjustedHour > 12) {
      return `오후 ${adjustedHour - 12}`;
    } else {
      return `오전 ${adjustedHour}`;
    }
  };

  return (
    <div class={styles.timeRangeControl}>
      <div class={styles.timeRangeSelect}>
        <select
          value={props.startHour()}
          onChange={(e) => props.setStartHour(Number(e.target.value))}
        >
          <For each={startOptions}>
            {(hour) => <option value={hour}>{formatHour(hour)}</option>}
          </For>
        </select>
        <span class={styles.timeRangeSeparator}>~</span>
        <select
          value={props.endHour()}
          onChange={(e) => props.setEndHour(Number(e.target.value))}
        >
          <For each={endOptions}>
            {(hour) => <option value={hour}>{formatHour(hour)}</option>}
          </For>
        </select>
      </div>
    </div>
  );
};
