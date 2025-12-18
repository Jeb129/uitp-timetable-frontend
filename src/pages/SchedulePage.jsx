import React, { useEffect } from 'react';

const SchedulePage = () => {
    useEffect(() => {
        window.open("https://eios.kosgos.ru/WebApp/#/Rasp/", "_blank");
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <p>Перенаправление на сайт расписания...</p>
        </div>
    );
};

export default SchedulePage;