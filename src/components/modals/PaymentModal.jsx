import React from 'react';
import './PaymentModal.css';
// Импортируем картинку. Путь зависит от расположения файла,
// но исходя из структуры src/components/modals/ -> ../../assets/
import qrCodeImg from '../../assets/qr-code.png';

const PaymentModal = ({ isOpen, onClose, amount }) => {
    if (!isOpen) return null;

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="payment-header">
                    <h3>Оплата бронирования</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="payment-content">
                    <p className="payment-amount">К оплате: <strong>{amount} ₽</strong></p>
                    <p className="payment-hint">Отсканируйте QR-код для оплаты</p>

                    <div className="qr-container">
                        <img src={qrCodeImg} alt="QR Code для оплаты" className="qr-image" />
                    </div>
                </div>

                <div className="payment-footer">
                    <button className="btn-pay" onClick={onClose}>
                        Оплатить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;