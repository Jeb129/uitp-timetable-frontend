// src/pages/KGUConfirmPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { privateApi } from '../utils/api/axios';
import './LoginPage.css';

const KGUConfirmPage = () => {
    const { user } = useAuth(); // Получаем текущего пользователя
    const [kguEmail, setKguEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setIsLoading(true);

        try {
            //  Проверяем наличие пользователя в Moodle
            const response = await privateApi.get('/moodle/user', {
                params: { email: kguEmail }
            });

            const data = response.data;

            // Если Moodle вернул массив пользователей и он не пуст
            if (data.users && data.users.length > 0) {
                const moodleUser = data.users[0];


                setStatus({ type: 'success', message: `Успешно! Пользователь ${moodleUser.fullname} найден. Аккаунт подтвержден.` });

                // Редирект в профиль
                setTimeout(() => navigate('/profile'), 1500);
            } else {
                setStatus({ type: 'error', message: 'Пользователь с такой почтой не найден в системе СДО КГУ.' });
            }

        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                setStatus({ type: 'error', message: err.response.data.error });
            } else {
                setStatus({ type: 'error', message: 'Ошибка соединения с сервером.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-centered">
            <div className="login-form-container">
                <h1>Подтверждение КГУ</h1>
                {status.message && <div style={{color: status.type==='error'?'red':'green', textAlign:'center', marginBottom:'10px'}}>{status.message}</div>}
                <form className="login-form" onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email КГУ" className="login-input" value={kguEmail} onChange={(e) => setKguEmail(e.target.value)} required />
                    <button type="submit" className="login-button" disabled={isLoading}>{isLoading ? '...' : 'Проверить'}</button>
                </form>
                <div className="login-footer" style={{marginTop:'20px'}}>
                    <button className="guest-link" style={{background:'none', border:'none', cursor:'pointer'}} onClick={() => navigate('/profile')}>Назад</button>
                </div>
            </div>
        </div>
    );
};

export default KGUConfirmPage;