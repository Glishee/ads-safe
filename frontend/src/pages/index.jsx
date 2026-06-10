import Layout from "./Layout.jsx";

import Home from "./Home";

import Login from "./login.jsx";

import Register from "./Register";

import AdvertiserDashboard from "./AdvertiserDashboard";

import ChannelsList from "./ChannelsList";

import RequestAd from "./RequestAd";

import ChannelOwnerDashboard from "./ChannelOwnerDashboard";

import AdminDashboard from "./AdminDashboard";

import AddChannel from "./AddChannel";

import MyChannels from "./MyChannels";

import AdRequest from "./AdRequest";

import AdminChannels from "./AdminChannels";

import AdminChannelDetail from "./AdminChannelDetail";

import AdminUsers from "./AdminUsers";

import AdminUserDetail from "./AdminUserDetail";

import ChannelOwnerAdRequests from "./ChannelOwnerAdRequests";

import ChannelOwnerStats from "./ChannelOwnerStats";

import AdminSettings from "./AdminSettings";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {

    Login: Login,
    
    Home: Home,
    
    Register: Register,
    
    AdvertiserDashboard: AdvertiserDashboard,
    
    ChannelsList: ChannelsList,
    
    RequestAd: RequestAd,
    
    ChannelOwnerDashboard: ChannelOwnerDashboard,
    
    AdminDashboard: AdminDashboard,
    
    AddChannel: AddChannel,
    
    MyChannels: MyChannels,
    
    AdRequest: AdRequest,
    
    AdminChannels: AdminChannels,
    
    AdminChannelDetail: AdminChannelDetail,
    
    AdminUsers: AdminUsers,
    
    AdminUserDetail: AdminUserDetail,
    
    ChannelOwnerAdRequests: ChannelOwnerAdRequests,
    
    ChannelOwnerStats: ChannelOwnerStats,

    AdminSettings: AdminSettings,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Register" element={<Register />} />

                <Route path="/Login" element={<Login />} />
                
                <Route path="/AdvertiserDashboard" element={<AdvertiserDashboard />} />
                
                <Route path="/ChannelsList" element={<ChannelsList />} />
                
                <Route path="/RequestAd" element={<RequestAd />} />
                
                <Route path="/ChannelOwnerDashboard" element={<ChannelOwnerDashboard />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                        
                <Route path="/AddChannel" element={<AddChannel />} />
                
                <Route path="/MyChannels" element={<MyChannels />} />
                
                <Route path="/AdRequest" element={<AdRequest />} />
                
                <Route path="/AdminChannels" element={<AdminChannels />} />
                
                <Route path="/AdminChannelDetail" element={<AdminChannelDetail />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/AdminUserDetail" element={<AdminUserDetail />} />
                
                <Route path="/ChannelOwnerAdRequests" element={<ChannelOwnerAdRequests />} />
                
                <Route path="/ChannelOwnerStats" element={<ChannelOwnerStats />} />

                <Route path="/AdminSettings" element={<AdminSettings />} />

            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}