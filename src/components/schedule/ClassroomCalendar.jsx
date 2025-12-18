import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./fullcalendar.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../../utils/api/axios";

export default function ClassroomCalendar({ classroom }) {
    const [events, setEvents] = useState([]);
    const [key, reloadKey] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        setEvents([]);
        publicApi
            .get(`classroom/schedule/${classroom.id}`)
            .then(res => {
                if (!res.data) return;
                setEvents(
                    res.data.map(ev => ({
                        id: ev.id,
                        title: ev.title,
                        start: ev.start,
                        end: ev.end
                    }))
                );
                console.log(events);
            });
    },[classroom]);

    return (
        <FullCalendar
            key={key}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            height="100%"

            nowIndicator

            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={events}

            selectable
            selectMirror

            select={(info) => {
                navigate("/booking", {
                    state: {
                        classroom,
                        start: info.startStr,
                        end: info.endStr
                    }
                });
            }}
        />
    );
}
