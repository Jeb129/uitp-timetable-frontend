import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="content">
                <Header />
                {children}
            </main>
        </div>
    );
};

export default AppLayout;