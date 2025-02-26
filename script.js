document.addEventListener("DOMContentLoaded", function () {
  const timetableBody = document.getElementById("timetable-body");
  const startHour = 7; // 오전 7시 시작
  const endHour = 25; // 새벽 1시까지 (25는 다음날 1시를 의미)
  let selectedColor = "#E3D2C3"; // 기본 색상 - 베이지/노란색

  // 시간표 생성
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const row = document.createElement("tr");

      // 시간 셀 - 선 없음
      const timeCell = document.createElement("td");
      timeCell.className = "time-cell";
      // 정각만 표시하고 24시 이후는 다음날로 표시
      if (min === 0) {
        const timeLabel = document.createElement("span");
        timeLabel.className = "time-label";
        if (hour < 24) {
          timeLabel.textContent = `${hour}`;
        } else {
          timeLabel.textContent = `${hour - 24}`;
        }
        timeCell.appendChild(timeLabel);
      }
      row.appendChild(timeCell);

      // 요일별 시간 슬롯
      for (let day = 0; day < 7; day++) {
        const cell = document.createElement("td");
        cell.className = "time-slot";

        // 시간 셀에 선 클래스 추가 (시간 열에서는 제외)
        if (min === 0) {
          cell.classList.add("hour-line");
        } else {
          cell.classList.add("half-hour-line");
        }

        cell.dataset.day = day;
        cell.dataset.hour = hour;
        cell.dataset.min = min;
        row.appendChild(cell);
      }

      timetableBody.appendChild(row);
    }
  }

  // 색상 팔레트 이벤트 리스너
  document.querySelectorAll(".color-option").forEach((option) => {
    option.addEventListener("click", function () {
      // 이전 선택 해제
      document.querySelectorAll(".color-option").forEach((opt) => {
        opt.classList.remove("selected");
      });

      // 현재 선택 표시
      this.classList.add("selected");

      // 선택된 색상 저장 (기존 박스 색상은 변경하지 않음)
      selectedColor = this.dataset.color;
    });
  });

  // 드래그 기능 구현
  let isSelecting = false;
  let startCell = null;
  let selectedCells = [];
  let startDay = null; // 드래그 시작 요일 저장

  function clearSelection() {
    selectedCells.forEach((cell) => {
      cell.classList.remove("selected");
    });
    selectedCells = [];
  }

  // 박스가 특정 셀에 있는지 확인하는 함수
  function hasCourseBox(cell) {
    return cell.querySelector(".course-box") !== null;
  }

  // 특정 셀과 그 위의 셀들에 박스가 있는지 확인하는 함수
  function hasBoxAbove(day, hour, min) {
    const cells = document.querySelectorAll(`.time-slot[data-day="${day}"]`);

    for (let cell of cells) {
      const cellHour = parseInt(cell.dataset.hour);
      const cellMin = parseInt(cell.dataset.min);

      // 현재 셀과 그 위에 있는 셀들만 확인
      if (cellHour < hour || (cellHour === hour && cellMin <= min)) {
        if (hasCourseBox(cell)) {
          return true;
        }
      }
    }

    return false;
  }

  function selectCellsBetween(start, end) {
    if (!start || !end) return;

    clearSelection();

    // 시작 요일 고정 (드래그가 다른 요일로 넘어가도 시작 요일로 제한)
    const day = startDay;

    // 현재 요일의 시간만 고려
    const endHour = parseInt(end.dataset.hour);
    const endMin = parseInt(end.dataset.min);

    // 시작 시간과 현재 시간 정렬
    const startHour = parseInt(start.dataset.hour);
    const startMin = parseInt(start.dataset.min);

    const minHour = Math.min(startHour, endHour);
    const maxHour = Math.max(startHour, endHour);

    // 드래그 방향에 따라 시작/끝 시간 결정
    let selectStartTime, selectEndTime;

    if (startHour < endHour || (startHour === endHour && startMin <= endMin)) {
      // 아래로 드래그
      selectStartTime = { hour: startHour, min: startMin };
      selectEndTime = { hour: endHour, min: endMin };
    } else {
      // 위로 드래그
      selectStartTime = { hour: endHour, min: endMin };
      selectEndTime = { hour: startHour, min: startMin };
    }

    // 선택할 셀 결정
    const selectableCells = [];
    const allCells = Array.from(
      document.querySelectorAll(`.time-slot[data-day="${day}"]`)
    );

    for (const cell of allCells) {
      const cellHour = parseInt(cell.dataset.hour);
      const cellMin = parseInt(cell.dataset.min);

      // 시간 범위 내에 있는지 확인
      const cellTime = cellHour * 60 + cellMin;
      const startTime = selectStartTime.hour * 60 + selectStartTime.min;
      const endTime = selectEndTime.hour * 60 + selectEndTime.min;

      if (cellTime >= startTime && cellTime <= endTime) {
        // 제한 조건: 셀에 이미 박스가 있거나, 위에 박스가 있으면 선택 중단
        if (hasCourseBox(cell)) {
          // 맨 처음 셀(드래그 시작 셀)이 박스를 포함하더라도 선택 가능
          if (cell !== start) {
            break; // 박스 발견 시 그 이후 선택 중단
          }
        }

        selectableCells.push(cell);
      }
    }

    // 선택된 셀 표시
    selectableCells.forEach((cell) => {
      cell.classList.add("selected");
      selectedCells.push(cell);
    });
  }

  function createCourseBox() {
    if (selectedCells.length === 0) return;

    // 정렬된 셀 가져오기
    const sortedCells = [...selectedCells].sort((a, b) => {
      const aTime = parseInt(a.dataset.hour) * 60 + parseInt(a.dataset.min);
      const bTime = parseInt(b.dataset.hour) * 60 + parseInt(b.dataset.min);
      return aTime - bTime;
    });

    const firstCell = sortedCells[0];
    const lastCell = sortedCells[sortedCells.length - 1];
    const day = parseInt(firstCell.dataset.day);
    const startHour = parseInt(firstCell.dataset.hour);
    const startMin = parseInt(firstCell.dataset.min);
    const endHour = parseInt(lastCell.dataset.hour);
    const endMin = parseInt(lastCell.dataset.min);

    // 코스 박스 생성
    const courseBox = document.createElement("div");
    courseBox.className = "course-box";
    courseBox.style.backgroundColor = selectedColor;
    courseBox.dataset.day = day;
    courseBox.dataset.startHour = startHour;
    courseBox.dataset.startMin = startMin;
    courseBox.dataset.endHour = endHour;
    courseBox.dataset.endMin = endMin;
    courseBox.dataset.color = selectedColor;

    // 편집 가능한 제목 생성
    const courseTitle = document.createElement("div");
    courseTitle.className = "course-title";
    courseTitle.contentEditable = true;
    courseTitle.textContent = "강의명";
    courseTitle.addEventListener("input", saveTimetable);

    // 편집 가능한 교수명 생성
    const courseInstructor = document.createElement("div");
    courseInstructor.className = "course-instructor";
    courseInstructor.contentEditable = true;
    courseInstructor.textContent = "담당교수";
    courseInstructor.addEventListener("input", saveTimetable);

    // 편집 가능한 장소 생성
    const courseLocation = document.createElement("div");
    courseLocation.className = "course-location";
    courseLocation.contentEditable = true;
    courseLocation.textContent = "강의실";
    courseLocation.addEventListener("input", saveTimetable);

    // 삭제 버튼 추가
    const deleteButton = document.createElement("div");
    deleteButton.className = "delete-button";
    deleteButton.innerHTML = "×";
    deleteButton.addEventListener("click", function (e) {
      e.stopPropagation();
      courseBox.remove();
      saveTimetable();
    });

    courseBox.appendChild(deleteButton);
    courseBox.appendChild(courseTitle);
    courseBox.appendChild(courseInstructor);
    courseBox.appendChild(courseLocation);

    // 첫 번째 셀에 박스 추가
    firstCell.appendChild(courseBox);

    // 박스 크기 계산 - 여러 셀에 걸쳐있을 경우
    if (sortedCells.length > 1) {
      // 정확한 높이 계산 (첫 번째 셀부터 마지막 셀까지)
      const firstCellRect = firstCell.getBoundingClientRect();
      const lastCellRect = lastCell.getBoundingClientRect();
      const totalHeight = lastCellRect.bottom - firstCellRect.top;

      // 각 셀의 스타일링 (위/아래 정렬 수정)
      for (let i = 1; i < sortedCells.length; i++) {
        sortedCells[i].style.position = "relative";
        sortedCells[i].style.zIndex = "-1";
      }

      // 테두리와 패딩을 고려한 높이 조정
      courseBox.style.height = `${totalHeight - 2}px`;
    }

    // 선택 초기화
    clearSelection();

    // 시간표 저장
    saveTimetable();
  }

  // 이벤트 리스너
  document.querySelectorAll(".time-slot").forEach((cell) => {
    cell.addEventListener("mousedown", function (e) {
      // 기존 강의 박스 위에서 드래그 시작하면 무시
      if (e.target.closest(".course-box")) return;

      isSelecting = true;
      startCell = this;
      startDay = parseInt(this.dataset.day); // 드래그 시작 요일 저장

      clearSelection();
      this.classList.add("selected");
      selectedCells.push(this);
      e.preventDefault(); // 텍스트 선택 방지
    });

    cell.addEventListener("mouseover", function () {
      if (isSelecting) {
        selectCellsBetween(startCell, this);
      }
    });
  });

  document.addEventListener("mouseup", function () {
    if (isSelecting && selectedCells.length > 0) {
      createCourseBox();
    }
    isSelecting = false;
    startCell = null;
    startDay = null; // 드래그 요일 초기화
  });

  // 시간표 저장 함수
  function saveTimetable() {
    const courseBoxes = document.querySelectorAll(".course-box");
    const timetableData = [];

    courseBoxes.forEach((box) => {
      const courseData = {
        day: parseInt(box.dataset.day),
        startHour: parseInt(box.dataset.startHour),
        startMin: parseInt(box.dataset.startMin),
        endHour: parseInt(box.dataset.endHour),
        endMin: parseInt(box.dataset.endMin),
        color: box.dataset.color,
        title: box.querySelector(".course-title").textContent,
        instructor: box.querySelector(".course-instructor").textContent,
        location: box.querySelector(".course-location").textContent,
        height: box.style.height,
      };
      timetableData.push(courseData);
    });

    localStorage.setItem("timetableData", JSON.stringify(timetableData));
  }

  // 시간표 불러오기 함수
  function loadTimetable() {
    const savedData = localStorage.getItem("timetableData");
    if (!savedData) return;

    const timetableData = JSON.parse(savedData);

    timetableData.forEach((courseData) => {
      // 첫 번째 셀 찾기
      const firstCell = document.querySelector(
        `.time-slot[data-day="${courseData.day}"][data-hour="${courseData.startHour}"][data-min="${courseData.startMin}"]`
      );

      if (firstCell) {
        // 코스 박스 생성
        const courseBox = document.createElement("div");
        courseBox.className = "course-box";
        courseBox.style.backgroundColor = courseData.color;
        courseBox.style.height = courseData.height;
        courseBox.dataset.day = courseData.day;
        courseBox.dataset.startHour = courseData.startHour;
        courseBox.dataset.startMin = courseData.startMin;
        courseBox.dataset.endHour = courseData.endHour;
        courseBox.dataset.endMin = courseData.endMin;
        courseBox.dataset.color = courseData.color;

        // 삭제 버튼 추가
        const deleteButton = document.createElement("div");
        deleteButton.className = "delete-button";
        deleteButton.innerHTML = "×";
        deleteButton.addEventListener("click", function (e) {
          e.stopPropagation();
          courseBox.remove();
          saveTimetable();
        });

        // 제목 생성
        const courseTitle = document.createElement("div");
        courseTitle.className = "course-title";
        courseTitle.contentEditable = true;
        courseTitle.textContent = courseData.title;
        courseTitle.addEventListener("input", saveTimetable);

        // 교수명 생성
        const courseInstructor = document.createElement("div");
        courseInstructor.className = "course-instructor";
        courseInstructor.contentEditable = true;
        courseInstructor.textContent = courseData.instructor;
        courseInstructor.addEventListener("input", saveTimetable);

        // 장소 생성
        const courseLocation = document.createElement("div");
        courseLocation.className = "course-location";
        courseLocation.contentEditable = true;
        courseLocation.textContent = courseData.location;
        courseLocation.addEventListener("input", saveTimetable);

        courseBox.appendChild(deleteButton);
        courseBox.appendChild(courseTitle);
        courseBox.appendChild(courseInstructor);
        courseBox.appendChild(courseLocation);

        // 셀에 박스 추가
        firstCell.appendChild(courseBox);

        // 마지막 셀까지의 셀들 스타일링
        const lastCell = document.querySelector(
          `.time-slot[data-day="${courseData.day}"][data-hour="${courseData.endHour}"][data-min="${courseData.endMin}"]`
        );

        if (lastCell && firstCell !== lastCell) {
          // 시작 시간과 종료 시간 사이의 모든 셀 가져오기
          const startTime = courseData.startHour * 60 + courseData.startMin;
          const endTime = courseData.endHour * 60 + courseData.endMin;

          const allCells = Array.from(
            document.querySelectorAll(
              `.time-slot[data-day="${courseData.day}"]`
            )
          ).filter((cell) => {
            const cellTime =
              parseInt(cell.dataset.hour) * 60 + parseInt(cell.dataset.min);
            return cellTime > startTime && cellTime <= endTime;
          });

          // 중간에 있는 셀들 스타일링
          allCells.forEach((cell) => {
            cell.style.position = "relative";
            cell.style.zIndex = "-1";
          });
        }
      }
    });
  }

  // 페이지 로드 시 시간표 불러오기
  loadTimetable();

  // 다운로드 버튼 기능
  document
    .getElementById("download-btn")
    .addEventListener("click", function () {
      const dataStr = JSON.stringify(
        JSON.parse(localStorage.getItem("timetableData")),
        null,
        2
      );
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "timetable.json";
      a.click();
      URL.revokeObjectURL(url);
    });

  // 로드 버튼 기능
  document.getElementById("load-btn").addEventListener("click", function () {
    document.getElementById("load-input").click();
  });

  document
    .getElementById("load-input")
    .addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        const content = e.target.result;
        try {
          const data = JSON.parse(content);
          localStorage.setItem("timetableData", JSON.stringify(data));
          // 기존 시간표 초기화
          document
            .querySelectorAll(".course-box")
            .forEach((box) => box.remove());
          // 새 데이터 로드
          loadTimetable();
        } catch (error) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    });
});
