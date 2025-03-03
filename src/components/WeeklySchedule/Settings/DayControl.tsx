import { Component, For } from "solid-js";
import styles from "./Settings.module.css";

interface DayControlProps {
  activeDays: () => number[];
  setActiveDays: (days: number[]) => void;
}

export const DayControl: Component<DayControlProps> = (props) => {
  const days = ["일", "월", "화", "수", "목", "금", "토", "일"];

  const toggleDay = (dayIndex: number) => {
    const currentDays = props.activeDays();
    if (currentDays.includes(dayIndex)) {
      // 이미 활성화된 요일이면 제거
      props.setActiveDays(currentDays.filter((d) => d !== dayIndex));
    } else {
      // 비활성화된 요일이면 추가
      props.setActiveDays([...currentDays, dayIndex].sort((a, b) => a - b));
    }
  };

  return (
    <div class={styles.dayControl}>
      <For each={days}>
        {(day, index) => (
          <button
            class={`${styles.dayButton} ${
              props.activeDays().includes(index()) ? styles.dayActive : ""
            } ${day === "일" || day === "토" ? styles.dayRed : ""}`}
            onClick={() => toggleDay(index())}
          >
            {day}
          </button>
        )}
      </For>
    </div>
  );
};
