import { useEffect, useState } from "react";
import { getObject } from "../../utils/api/database";
import "./ClassroomList.css";

export default function ClassroomList({ onSelect, selectedId  }) {
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    getObject("classroom").then(data => {
      setClassrooms(data);
      console.log(data)
    });
  }, []);

  return (
    <div className="classroom-list">
      {classrooms.map(c => (
        <div
          key={c.id}
          className={`classroom-item ${selectedId === c.id ? "selected" : ""}`}
          onClick={() => onSelect(c)}
          style={{
            padding: "12px 16px",
            cursor: "pointer",
            borderBottom: "1px solid #f1f5f9"
          }}
        >
          {c.number}
        </div>
      ))}
    </div>
  );
}
