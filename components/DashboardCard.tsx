
import React from 'react';

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md p-6 flex items-center justify-between border-l-4 ${color}`}>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
            <div className="text-4xl text-gray-300">
                {icon}
            </div>
        </div>
    );
};

export default DashboardCard;
