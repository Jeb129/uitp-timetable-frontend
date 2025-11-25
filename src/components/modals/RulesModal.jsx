// src/components/RulesModal.jsx
import React from 'react';
import './RulesModal.css';

const RulesModal = ({ onClose }) => {
    return (
        <div className="rules-modal-overlay" onClick={onClose}>
            <div className="rules-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="rules-modal-header">
                    <h2 className="rules-modal-title">Правила бронирования аудиторий</h2>
                    <button className="rules-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="rules-modal-content">
                    <div className="rule-item">
                        <h3>Рамки бронирования:</h3>
                        <div className="rule-content">
                            <p><strong>Для внутренних сотрудников и студентов:</strong></p>
                            <ul>
                                <li>С 8:00 по 20:00 МСК</li>
                                <li>Понедельник - Суббота</li>
                                <li>Воскресенье - выходной</li>
                            </ul>
                            <p><strong>Для внешних пользователей:</strong></p>
                            <ul>
                                <li>С 8:00 по 17:00 МСК</li>
                                <li>Понедельник - Суббота</li>
                                <li>Воскресенье - выходной</li>
                            </ul>
                        </div>
                    </div>

                    <div className="rule-item">
                        <h3>Продолжительность бронирования:</h3>
                        <div className="rule-content">
                            <p>Минимальная продолжительность бронирования - 15 минут. Максимальная ограничена другими мероприятиями в графике и временем работы корпуса.</p>
                        </div>
                    </div>

                    <div className="rule-item">
                        <h3>Ограничения по времени:</h3>
                        <div className="rule-content">
                            <p>Бронирование студентами осуществляется не позже, чем за 15 минут до начала мероприятия.</p>
                            <p>Бронирование сторонними пользователями - не позже, чем за 1 день, для прохождения проверки модерации. Оплата производится сразу безналичным платежом.</p>
                        </div>
                    </div>

                    <div className="rule-item">
                        <h3>Модерация:</h3>
                        <div className="rule-content">
                            <p>На время прохождения проверки модерации - аудитория будет зарезервирована.</p>
                            <p>В случае предоставления неверных данных, модерация вправе отказать в заявке.</p>
                            <p>В случае отказа - будет произведен возврат денежных средств.</p>
                            <p>Статус заявки можно посмотреть в личном кабинете.</p>
                        </div>
                    </div>

                    <div className="rule-item">
                        <h3>Неявка:</h3>
                        <div className="rule-content">
                            <p>Неявка в течение 30 минут от начала бронирования - отмена брони для всех пользователей и возврат денег.</p>
                        </div>
                    </div>

                    <div className="rule-item">
                        <h3>Завершение мероприятия:</h3>
                        <div className="rule-content">
                            <p>Мероприятие должно завершиться за 15 минут до начала следующего занятия/мероприятия в аудитории. Может начаться через 10 минут, после завершения предшествующего занятия/мероприятия.</p>
                        </div>
                    </div>

                    <div className="rule-item">
                        <h3>Оборудование:</h3>
                        <div className="rule-content">
                            <p>В заявке на бронирование необходимо обязательно указать оборудование, необходимое для мероприятия.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RulesModal;