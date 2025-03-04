import {
  createSignal,
  createEffect,
  onMount,
  For,
  Show,
  onCleanup,
} from "solid-js";
import { createStore } from "solid-js/store";
import styles from "./WeeklySchedule.module.css";
import { Settings } from "./Settings/Settings";
import type { TimeFormat } from "./Settings/TimeFormatControl";

// 타입 정의
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // 0: 일요일, 1: 월요일, ..., 6: 토요일, 7: 일요일
type TimeSlot = {
  day: Day;
  hour: number;
  minute: number;
};

type TextAlign = "left" | "center" | "right";

type Course = {
  id: string;
  title: string;
  time: string; // 자동 생성되는 시간 텍스트
  text: string; // 기타 텍스트
  color: string;
  day: Day;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  position?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

export default function WeeklySchedule() {
  // 상태 관리
  const [courses, setCourses] = createStore<Course[]>([]);
  const [selectedColor, setSelectedColor] = createSignal("#dde5b6");
  const [selectedCells, setSelectedCells] = createStore<TimeSlot[]>([]);
  const [dragStart, setDragStart] = createSignal<TimeSlot | null>(null);
  const [isDragging, setIsDragging] = createSignal(false);
  const [currentEnd, setCurrentEnd] = createSignal<TimeSlot | null>(null);
  const [overlayPosition, setOverlayPosition] = createSignal({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [titleAlign, setTitleAlign] = createSignal<TextAlign>("center");
  const [timeAlign, setTimeAlign] = createSignal<TextAlign>("center");
  const [textAlign, setTextAlign] = createSignal<TextAlign>("center");
  const [startHour, setStartHour] = createSignal(9);
  const [endHour, setEndHour] = createSignal(22);
  const [activeDays, setActiveDays] = createSignal([1, 2, 3, 4, 5]); // 기본값: 월~금
  const [timeFormat, setTimeFormat] = createSignal<TimeFormat>("korean"); // 기본값: 한글 형식
  const [isEditMode, setIsEditMode] = createSignal(true); // 수정 모드 상태 추가

  // 시간 형식이 변경될 때마다 모든 강의의 시간 텍스트 업데이트 (배치 처리)
  createEffect(() => {
    const format = timeFormat(); // 의존성 추적을 위해 시그널 읽기

    // 배치 처리를 위해 모든 업데이트를 한 번에 수행
    const updatedCourses = courses.map((course) => {
      const newTime = getTimeText(
        course.startHour,
        course.startMinute,
        course.endHour,
        course.endMinute
      );
      // 시간 형식이 실제로 변경된 경우에만 업데이트
      if (newTime !== course.time) {
        return { ...course, time: newTime };
      }
      return course;
    });

    // 변경된 내용이 있는 경우에만 상태 업데이트
    if (updatedCourses.some((course, i) => course.time !== courses[i].time)) {
      setCourses(updatedCourses);
    }
  });

  // 시간 범위 계산
  const hours = () =>
    Array.from(
      { length: endHour() - startHour() + 1 },
      (_, i) => i + startHour()
    );

  const days = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
    "일요일",
  ];

  // 색상 팔레트
  const colors = [
    "#ebccc0",
    "#dde5b6",
    "#faedcd",
    "#d9bdf8",
    "#a9cad0",
    "#e3e4fc",
    "#caf0f8",
    "#ffbf69",
  ];

  // 새로운 강의 박스 ID 생성
  const generateId = () =>
    `course-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 강의 박스 위치 재계산 함수
  const recalculateAllCoursePositions = () => {
    const timetable = document.getElementById("timetable");
    if (!timetable) return;

    const timetableRect = timetable.getBoundingClientRect();

    const updatedCourses = courses.map((course) => {
      const firstCellElement = document.querySelector(
        `td[data-day="${course.day}"][data-hour="${course.startHour}"][data-minute="${course.startMinute}"]`
      );

      const lastCellElement = document.querySelector(
        `td[data-day="${course.day}"][data-hour="${
          course.endHour
        }"][data-minute="${course.endMinute === 0 ? 30 : 0}"]`
      );

      if (firstCellElement) {
        const firstCellRect = firstCellElement.getBoundingClientRect();

        let height;
        if (lastCellElement) {
          const lastCellRect = lastCellElement.getBoundingClientRect();
          height = lastCellRect.bottom - firstCellRect.top;
        } else {
          const duration =
            (course.endHour - course.startHour) * 60 +
            (course.endMinute - course.startMinute);
          height = (duration / 30) * 14;
        }

        return {
          ...course,
          position: {
            top: firstCellRect.top - timetableRect.top,
            left: firstCellRect.left - timetableRect.left,
            width: firstCellRect.width,
            height: height,
          },
        };
      }
      return course;
    });

    setCourses(updatedCourses);
  };

  // activeDays가 변경될 때마다 위치 재계산을 위한 effect
  createEffect(() => {
    // activeDays의 변경을 감지
    activeDays();
    // DOM이 업데이트된 후 위치 재계산
    setTimeout(recalculateAllCoursePositions, 0);
  });

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    // 기본 색상 설정
    setSelectedColor(colors[1]); // 기본값으로 두 번째 색상 선택

    // ResizeObserver 설정
    const timetable = document.getElementById("timetable");
    if (timetable) {
      const resizeObserver = new ResizeObserver(() => {
        recalculateAllCoursePositions();
      });

      resizeObserver.observe(timetable);

      // cleanup
      onCleanup(() => {
        resizeObserver.disconnect();
      });
    }
  });

  // 셀 클릭 핸들러
  const handleCellMouseDown = (day: Day, hour: number, minute: number) => {
    clearSelection();
    setDragStart({ day, hour, minute });
    setIsDragging(true);
    // 클릭한 첫 번째 셀도 선택에 포함
    setSelectedCells([{ day, hour, minute }]);
    // 첫 셀의 오버레이 위치 계산
    updateOverlayPosition(day, hour, minute, day, hour, minute);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 마우스 이동 핸들러 - 크로스 데이 드래깅 지원 (다른 요일로 마우스가 이동해도 원래 요일의 높이만 조정)
  const handleCellMouseOver = (day: Day, hour: number, minute: number) => {
    if (isDragging() && dragStart()) {
      const start = dragStart()!;

      // 현재 시간이 기존 강의와 겹치는지 확인
      const currentTime = hour * 60 + minute;
      const startTime = start.hour * 60 + start.minute;

      // 드래그 방향 확인
      const isUpward = currentTime < startTime;

      // 기존 강의와의 충돌 확인
      let hasConflict = false;
      for (const course of courses) {
        if (course.day !== start.day) continue;

        const courseStartTime = course.startHour * 60 + course.startMinute;
        const courseEndTime = course.endHour * 60 + course.endMinute;

        if (isUpward) {
          // 위로 드래그할 때는 현재 시간이 기존 강의의 끝 시간보다 작거나 같으면 충돌
          if (currentTime <= courseEndTime && startTime > courseStartTime) {
            hasConflict = true;
            break;
          }
        } else {
          // 아래로 드래그할 때는 현재 시간이 기존 강의의 시작 시간보다 크거나 같으면 충돌
          if (currentTime >= courseStartTime && startTime < courseEndTime) {
            hasConflict = true;
            break;
          }
        }
      }

      // 충돌이 있으면 드래그 위치를 조정
      if (!hasConflict) {
        setCurrentEnd({ day: start.day, hour, minute });
        selectCellsBetween(start, { day: start.day, hour, minute });
        updateOverlayPosition(
          start.day,
          start.hour,
          start.minute,
          start.day,
          hour,
          minute
        );
      }
    }
  };

  // 마우스 업 핸들러
  const handleMouseUp = () => {
    if (isDragging() && dragStart()) {
      setIsDragging(false);

      // 현재 마우스 위치가 없는 경우(클릭만 한 경우) dragStart 위치를 currentEnd로 사용
      if (!currentEnd()) {
        setCurrentEnd(dragStart());
      }

      // 마우스를 뗀 시점에 선택된 셀이 있거나 클릭한 경우 강의 생성
      createCourseBox();
      document.removeEventListener("mouseup", handleMouseUp);
    }
  };

  // 오버레이 위치 실시간 업데이트
  const updateOverlayPosition = (
    startDay: Day,
    startHour: number,
    startMinute: number,
    endDay: Day,
    endHour: number,
    endMinute: number
  ) => {
    // 같은 요일만 처리 체크 제거 - 이미 handleCellMouseOver에서 보장함

    // DOM에서 직접 요소 찾기
    const table = document.getElementById("timetable");
    if (!table) return;

    const tableRect = table.getBoundingClientRect();

    // 첫 번째 셀 찾기
    const startCell = document.querySelector(
      `td[data-day="${startDay}"][data-hour="${startHour}"][data-minute="${startMinute}"]`
    );

    // 마지막 셀 찾기 (같은 요일, 다른 시간)
    const endCell = document.querySelector(
      `td[data-day="${endDay}"][data-hour="${endHour}"][data-minute="${endMinute}"]`
    );

    if (!startCell || !endCell) return;

    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();

    // 드래그 방향 확인 (위로 또는 아래로)
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const isUpward = endTime < startTime;
    const isSameCell = startTime === endTime;

    let top, height;

    if (isSameCell) {
      // 같은 셀 안에서 클릭했을 때
      top = startRect.top - tableRect.top;
      height = startRect.height; // 한 셀의 높이 사용
    } else if (isUpward) {
      // 위로 드래그할 때
      top = endRect.top - tableRect.top;
      height = startRect.bottom - endRect.top;
    } else {
      // 아래로 드래그할 때
      top = startRect.top - tableRect.top;
      height = endRect.bottom - startRect.top;
    }

    // 최종 위치 계산
    setOverlayPosition({
      top: top,
      left: startRect.left - tableRect.left,
      width: startRect.width,
      height: Math.max(height, startRect.height), // 최소 한 셀 높이 보장
    });
  };

  // 선택 초기화
  const clearSelection = () => {
    setSelectedCells([]);
    setDragStart(null);
    setCurrentEnd(null);
    setOverlayPosition({ top: 0, left: 0, width: 0, height: 0 });
  };

  // 셀 사이 선택 (성능 개선 버전)
  const selectCellsBetween = (start: TimeSlot, end: TimeSlot) => {
    // 시작과 끝은 항상 같은 요일을 사용하도록 수정됨 (handleCellMouseOver에서 보장)
    const day = start.day;
    const startTime = start.hour * 60 + start.minute;
    const endTime = end.hour * 60 + end.minute;

    // 시작/종료 시간 정렬
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);

    // 더 효율적인 선택 방식: 배열 미리 할당
    const newSelectedCells: TimeSlot[] = [];

    // 기존 강의들의 시간 범위를 미리 계산
    const existingTimeRanges = courses
      .filter((course) => course.day === day)
      .map((course) => ({
        start: course.startHour * 60 + course.startMinute,
        end: course.endHour * 60 + course.endMinute,
      }));

    // 시간 순서대로 선택 (30분 단위)
    for (let time = minTime; time <= maxTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;

      // 시간표 범위 체크 (9시~22시)
      if (hour < 9 || hour > 22) continue;

      // 강의 중복 체크
      let hasConflict = false;
      for (const range of existingTimeRanges) {
        // 시작 시간이나 끝 시간이 기존 강의와 겹치면 충돌로 처리
        if (time >= range.start && time <= range.end) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        newSelectedCells.push({ day, hour, minute });
      }
    }

    setSelectedCells(newSelectedCells);
  };

  // 시간을 "오전/오후 HH:MM" 형식으로 변환하는 함수
  const formatTime = (hour: number, minute: number) => {
    const format = timeFormat();
    const minuteStr = minute.toString().padStart(2, "0");
    const adjustedHour = hour >= 24 ? hour - 24 : hour;

    switch (format) {
      case "24h":
        return `${adjustedHour.toString().padStart(2, "0")}:${minuteStr}`;
      case "12h": {
        const h12 =
          adjustedHour > 12
            ? adjustedHour - 12
            : adjustedHour === 0
            ? 12
            : adjustedHour;
        const period = adjustedHour >= 12 && adjustedHour < 24 ? "PM" : "AM";
        return `${h12}:${minuteStr} ${period}`;
      }
      case "korean": {
        let period;
        let h;
        if (adjustedHour === 0) {
          period = "자정";
          h = 12;
        } else if (adjustedHour === 12) {
          period = "정오";
          h = 12;
        } else if (adjustedHour > 12) {
          period = "오후";
          h = adjustedHour - 12;
        } else {
          period = "오전";
          h = adjustedHour;
        }
        return `${period} ${h}시${minute > 0 ? ` ${minute}분` : ""}`;
      }
      case "simple":
        return `${adjustedHour}시 ${minuteStr}분`;
      default:
        return `${adjustedHour}:${minuteStr}`;
    }
  };

  // 시간 텍스트 생성 함수 수정
  const getTimeText = (
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number
  ) => {
    const start = formatTime(startHour, startMinute);
    const end = formatTime(endHour, endMinute);
    return `${start} ~ ${end}`;
  };

  // 강의 박스 생성
  const createCourseBox = () => {
    if (!dragStart() || !currentEnd()) return;

    const start = dragStart()!;
    const end = currentEnd()!;

    // 시작 셀과 끝 셀을 정렬
    const startTime = start.hour * 60 + start.minute;
    const endTime = end.hour * 60 + end.minute;

    let startHour, startMinute, endHour, endMinute;
    const isUpward = endTime < startTime;
    const isSameCell = startTime === endTime;

    if (isSameCell) {
      startHour = start.hour;
      startMinute = start.minute;
      endHour = start.hour;
      endMinute = start.minute;
      if (startMinute === 0) {
        endMinute = 30;
      } else {
        endHour = startHour + 1;
        endMinute = 0;
      }
    } else if (!isUpward) {
      startHour = start.hour;
      startMinute = start.minute;
      endHour = end.hour;
      endMinute = end.minute;
    } else {
      startHour = end.hour;
      startMinute = end.minute;
      endHour = start.hour;
      endMinute = start.minute;
    }

    // 오버레이의 현재 위치를 사용하여 새 강의 박스 생성
    const currentOverlay = overlayPosition();

    // 새 강의 추가
    const newCourse: Course = {
      id: generateId(),
      title: "새 강의",
      time: getTimeText(startHour, startMinute, endHour, endMinute),
      text: "설명을 입력하세요",
      color: selectedColor(),
      day: start.day,
      startHour,
      startMinute,
      endHour,
      endMinute,
      position: {
        top: currentOverlay.top,
        left: currentOverlay.left,
        width: currentOverlay.width,
        height: currentOverlay.height,
      },
    };

    setCourses([...courses, newCourse]);
    clearSelection();
  };

  // 강의 삭제
  const deleteCourse = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  // 강의 내용 업데이트
  const updateCourseContent = (
    id: string,
    field: "title" | "text",
    value: string
  ) => {
    setCourses((course) => course.id === id, field as any, value);
  };

  // 시간표 저장
  const saveTimetable = () => {
    const data = JSON.stringify(courses);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 시간표 불러오기
  const loadTimetable = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const loadedCourses = JSON.parse(
          e.target?.result as string
        ) as Course[];

        // 로드된 과목들의 위치 정보 계산
        const updatedCourses = loadedCourses.map((course) => {
          if (!course.position) {
            // 위치 정보가 없는 경우, 표 상의 위치를 통해 계산
            const firstCellElement = document.querySelector(
              `td[data-day="${course.day}"][data-hour="${course.startHour}"][data-minute="${course.startMinute}"]`
            );

            const lastCellElement = document.querySelector(
              `td[data-day="${course.day}"][data-hour="${
                course.endHour
              }"][data-minute="${course.endMinute === 0 ? 30 : 0}"]`
            );

            if (firstCellElement) {
              const timetableRect = document
                .getElementById("timetable")
                ?.getBoundingClientRect();
              const firstCellRect = firstCellElement.getBoundingClientRect();

              let height;
              if (lastCellElement) {
                const lastCellRect = lastCellElement.getBoundingClientRect();
                height = lastCellRect.bottom - firstCellRect.top;
              } else {
                // 마지막 셀이 없는 경우
                const duration =
                  (course.endHour - course.startHour) * 60 +
                  (course.endMinute - course.startMinute);
                height = (duration / 30) * 14; // 30분당 14px
              }

              course.position = {
                top: firstCellRect.top - (timetableRect?.top || 0),
                left: firstCellRect.left - (timetableRect?.left || 0),
                width: firstCellRect.width,
                height: height,
              };
            }
          }
          return course;
        });

        setCourses(updatedCourses);
      } catch (error) {
        console.error("파일 로드 오류:", error);
        alert("유효하지 않은 시간표 파일입니다.");
      }
    };

    reader.readAsText(file);
  };

  // 정렬 순환 함수
  const cycleAlignment = (current: TextAlign): TextAlign => {
    if (current === "left") return "center";
    if (current === "center") return "right";
    return "left";
  };

  // 강의 박스 스타일 계산 수정
  const getCourseStyle = (course: Course) => {
    if (!course.position) {
      console.warn(`Course ${course.id} has no position information`);
    }

    return {
      position: "absolute",
      top: `${(course.position?.top || 0) + 2}px`,
      left: `${(course.position?.left || 0) + 2}px`,
      width: `${(course.position?.width || 0) - 4}px`,
      height: `${(course.position?.height || 0) - 4}px`,
      "background-color": course.color,
      opacity: "1",
      "z-index": 10,
      "border-radius": "4px",
      transition: "transform 0.2s, box-shadow 0.2s",
      "transform-origin": "center",
      "will-change": "transform, width, height",
      "backface-visibility": "hidden",
      "pointer-events": "auto",
    } as any;
  };

  return (
    <div class={styles.timetableContainer}>
      <h2>Weekly Schedule</h2>

      <div class={styles.contentWrapper}>
        <div class={styles.timetableSection}>
          <div class={styles.timetableWrapper}>
            <table class={styles.timetable} id="timetable">
              <thead>
                <tr>
                  <th class={styles.timeCell}></th>
                  <For each={activeDays()}>
                    {(dayIndex) => {
                      const dayName = days[dayIndex];

                      const isWeekend =
                        dayIndex === 0 || dayIndex === 6 || dayIndex === 7;
                      return (
                        <th
                          class={`${styles.dayHeader} ${
                            isWeekend ? styles.weekendDay : ""
                          }`}
                          style={isWeekend ? { color: "#e74c3c" } : {}}
                        >
                          {dayName}
                        </th>
                      );
                    }}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={hours()}>
                  {(hour) => (
                    <>
                      {/* 정시 (hour:00) */}
                      <tr>
                        <td class={styles.timeCell}>
                          <div class={styles.timeLabel}>
                            {hour >= 24 ? hour - 24 : hour}:00
                          </div>
                        </td>
                        <For each={activeDays()}>
                          {(dayIndex) => (
                            <td
                              class={`${styles.timeSlot} ${styles.hourLine}`}
                              onMouseDown={() =>
                                handleCellMouseDown(dayIndex as Day, hour, 0)
                              }
                              onMouseOver={() =>
                                handleCellMouseOver(dayIndex as Day, hour, 0)
                              }
                              data-day={dayIndex}
                              data-hour={hour}
                              data-minute={0}
                            ></td>
                          )}
                        </For>
                      </tr>
                      {/* 30분 (hour:30) */}
                      <tr>
                        <td class={styles.timeCell}></td>
                        <For each={activeDays()}>
                          {(dayIndex) => (
                            <td
                              class={`${styles.timeSlot} ${styles.halfHourLine}`}
                              onMouseDown={() =>
                                handleCellMouseDown(dayIndex as Day, hour, 30)
                              }
                              onMouseOver={() =>
                                handleCellMouseOver(dayIndex as Day, hour, 30)
                              }
                              data-day={dayIndex}
                              data-hour={hour}
                              data-minute={30}
                            ></td>
                          )}
                        </For>
                      </tr>
                    </>
                  )}
                </For>
              </tbody>
            </table>

            {/* 강의 박스 */}
            <div class={styles.courseBoxGrid}>
              <For each={courses}>
                {(course) => (
                  <Show when={activeDays().includes(course.day)}>
                    <div
                      class={styles.courseBox}
                      style={getCourseStyle(course)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        class={styles.deleteButton}
                        onClick={() => deleteCourse(course.id)}
                      >
                        ×
                      </div>
                      <div
                        class={styles.courseTitle}
                        style={{ "text-align": titleAlign() }}
                        contentEditable={true}
                        onBlur={(e) =>
                          updateCourseContent(
                            course.id,
                            "title",
                            e.currentTarget.textContent || ""
                          )
                        }
                      >
                        {course.title}
                      </div>
                      <div
                        style={{
                          "font-weight": "normal",
                          "margin-bottom": "1px",
                          "font-size": "5.5px",
                          width: "100%",
                          color: "#444",
                          "user-select": "none",
                          "text-align": timeAlign(),
                        }}
                      >
                        {course.time}
                      </div>
                      <div
                        style={{
                          "font-weight": "normal",
                          "font-size": "5.5px",
                          color:
                            course.text === "설명을 입력하세요"
                              ? "#888"
                              : "#555",
                          width: "100%",
                          "text-align": textAlign(),
                        }}
                        contentEditable={true}
                        onFocus={(e) => {
                          if (
                            e.currentTarget.textContent === "설명을 입력하세요"
                          ) {
                            e.currentTarget.textContent = "";
                          }
                        }}
                        onBlur={(e) => {
                          if (!e.currentTarget.textContent?.trim()) {
                            e.currentTarget.textContent = "설명을 입력하세요";
                            updateCourseContent(
                              course.id,
                              "text",
                              "설명을 입력하세요"
                            );
                          } else {
                            updateCourseContent(
                              course.id,
                              "text",
                              e.currentTarget.textContent
                            );
                          }
                        }}
                      >
                        {course.text}
                      </div>
                    </div>
                  </Show>
                )}
              </For>
            </div>

            {/* 드래그 오버레이 */}
            {isDragging() && (
              <div class={styles.dragOverlay}>
                <div
                  class={styles.dragOverlayBox}
                  style={{
                    "--selected-color": selectedColor(),
                    top: `${overlayPosition().top}px`,
                    left: `${overlayPosition().left}px`,
                    width: `${overlayPosition().width}px`,
                    height: `${overlayPosition().height}px`,
                  }}
                />
              </div>
            )}
          </div>

          {/* 모드 전환 스위치 */}
          <div class={styles.modeToggleContainer}>
            <span class={styles.modeToggleLabel}>보기</span>
            <label class={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={isEditMode()}
                onChange={(e) => setIsEditMode(e.currentTarget.checked)}
              />
              <span class={styles.slider}></span>
            </label>
            <span class={styles.modeToggleLabel}>수정</span>
          </div>
        </div>

        {/* 설정 패널 */}
        <div
          class={`${styles.settingsSection} ${
            isEditMode() ? styles.visible : ""
          }`}
        >
          <Show when={isEditMode()}>
            <Settings
              titleAlign={titleAlign}
              timeAlign={timeAlign}
              textAlign={textAlign}
              setTitleAlign={setTitleAlign}
              setTimeAlign={setTimeAlign}
              setTextAlign={setTextAlign}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              colors={colors}
              startHour={startHour}
              endHour={endHour}
              setStartHour={setStartHour}
              setEndHour={setEndHour}
              activeDays={activeDays}
              setActiveDays={setActiveDays}
              timeFormat={timeFormat}
              setTimeFormat={setTimeFormat}
              onSave={saveTimetable}
              onLoad={loadTimetable}
            />
          </Show>
        </div>
      </div>
    </div>
  );
}
