import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './AdminCharts.css';

// Регистрируем необходимые компоненты Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AdminCharts = ({ statistics, bookings, users }) => {
    // Данные для графика статусов бронирований
    const bookingStatusData = {
        labels: ['Подтверждено', 'На модерации', 'Отклонено'],
        datasets: [
            {
                label: 'Количество бронирований',
                data: [
                    statistics.approvedBookings,
                    statistics.pendingModeration,
                    statistics.rejectedBookings
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    // Данные для графика статусов пользователей
    const userStatusData = {
        labels: ['Активные', 'На проверке', 'Заблокированные'],
        datasets: [
            {
                label: 'Количество пользователей',
                data: [
                    statistics.activeUsers,
                    statistics.pendingUsers,
                    statistics.blockedUsers
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    // Данные для графика распределения пользователей по ролям
    const userRolesData = {
        labels: ['Студенты', 'Сотрудники', 'Внешние пользователи'],
        datasets: [
            {
                label: 'Распределение по ролям',
                data: [
                    users.filter(user => user.role === 'student').length,
                    users.filter(user => user.role === 'employee').length,
                    users.filter(user => user.role === 'external').length
                ],
                backgroundColor: [
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(201, 203, 207, 0.6)'
                ],
                borderColor: [
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    // Данные для графика бронирований по дням (примерные данные)
    const bookingsByDayData = {
        labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        datasets: [
            {
                label: 'Бронирования по дням недели',
                data: [12, 19, 15, 17, 22, 8, 5],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    // Настройки для графиков
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Статистика по статусам',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            },
        },
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Бронирования по дням недели',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: 'Распределение по ролям',
            },
        },
    };

    return (
        <div className="charts-container">
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-title">Статусы бронирований</div>
                    <div className="chart-wrapper">
                        <Bar data={bookingStatusData} options={barOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Статусы пользователей</div>
                    <div className="chart-wrapper">
                        <Bar data={userStatusData} options={barOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Распределение пользователей по ролям</div>
                    <div className="chart-wrapper">
                        <Doughnut data={userRolesData} options={doughnutOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Активность бронирований</div>
                    <div className="chart-wrapper">
                        <Line data={bookingsByDayData} options={lineOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCharts;