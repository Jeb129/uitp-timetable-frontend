// src/pages/KGUPage.jsx
import React, {useEffect} from "react";

const KGUPage = () => {
    useEffect(() => {
        window.open("https://kosgos.ru", "_blank");
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <p>Перенаправление на сайт КГУ...</p>
        </div>
    );
};

export default KGUPage;