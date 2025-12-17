import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { privateApi } from '../utils/api/axios'; // Приватный API, так как юзер уже залогинен
import './LoginPage.css';

const KGUConfirmPage = () => {
    const [kguEmail, setKguEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setIsLoading(true);

        try {
            // privateApi автоматически добавит Authorization header
            const response = await privateApi.get('/moodle/user', {
                params: { email: kguEmail }
            });

            const data = response.data;
            if (data.users && data.users.length > 0) {
                setStatus({ type: 'success', message: `Успешно! Пользователь найден.` });
                setTimeout(() => navigate('/profile'), 2000);
            } else {
                setStatus({ type: 'error', message: 'Пользователь не найден.' });
            }

        } catch (err) {
            console.error(err);
            // Интерцептор обработает обновление токена, если нужно
            if (err.response && err.response.data && err.response.data.error) {
                setStatus({ type: 'error', message: err.response.data.error });
            } else {
                setStatus({ type: 'error', message: 'Ошибка сервера' });
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