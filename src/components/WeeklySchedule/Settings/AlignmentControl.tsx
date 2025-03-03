import { Component } from "solid-js";
import styles from "./Settings.module.css";

type TextAlign = "left" | "center" | "right";

interface AlignmentControlProps {
  titleAlign: () => TextAlign;
  timeAlign: () => TextAlign;
  textAlign: () => TextAlign;
  setTitleAlign: (align: TextAlign) => void;
  setTimeAlign: (align: TextAlign) => void;
  setTextAlign: (align: TextAlign) => void;
}

export const AlignmentControl: Component<AlignmentControlProps> = (props) => {
  const cycleAlignment = (current: TextAlign): TextAlign => {
    if (current === "left") return "center";
    if (current === "center") return "right";
    return "left";
  };

  return (
    <div class={styles.alignmentControl}>
      <div
        class={styles.alignmentButton}
        style={{ "text-align": props.titleAlign() }}
        onClick={() => props.setTitleAlign(cycleAlignment(props.titleAlign()))}
      >
        새 강의
      </div>
      <div
        class={styles.alignmentButton}
        style={{ "text-align": props.timeAlign() }}
        onClick={() => props.setTimeAlign(cycleAlignment(props.timeAlign()))}
      >
        오전 11:00 ~ 오후 12:00
      </div>
      <div
        class={styles.alignmentButton}
        style={{ "text-align": props.textAlign() }}
        onClick={() => props.setTextAlign(cycleAlignment(props.textAlign()))}
      >
        설명을 입력하세요
      </div>
    </div>
  );
};
