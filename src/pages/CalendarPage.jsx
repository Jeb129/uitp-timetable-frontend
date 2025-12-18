import { useState } from "react";
import ClassroomList from "../components/schedule/ClassroomList";
import ClassroomCalendar from "../components/schedule/ClassroomCalendar";

export default function CalendarPage (){
    const [selectedClassroom, setSelectedClassroom] = useState(null);

    return (
        <div style={{ display: "flex", height: "100%" }}>

            {/* Левая колонка */}
            <div style={{ width: 280, borderRight: "1px solid #e5e7eb" }}>
                <ClassroomList
                    onSelect={setSelectedClassroom}
                    selectedId={selectedClassroom?.id}
                />
            </div>

            {/* Правая часть */}
            <div style={{ flex: 1, padding: 16 }}>
                {!selectedClassroom ? (
                    <div style={{ color: "#6b7280", fontSize: 18 }}>
                        Выберите аудиторию
                    </div>
                ) : (
                    <ClassroomCalendar classroom={selectedClassroom} />
                )}
            </div>

        </div>
    );
}