
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Eye, 
  X, 
  Check, 
  AlertCircle, 
  FilterX,
  Filter
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // "all", "admin", "channel_owner", "advertiser"
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        if (userData.role !== "admin") {
          navigate(createPageUrl("Home"));
          return;
        }
        
        const allUsers = await User.list("-created_date");
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(getTranslation(language, "errorLoadingUsers"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [navigate, language]);
  
  useEffect(() => {
    applyFilters();
  }, [searchQuery, roleFilter, statusFilter, users]);
  
  const applyFilters = () => {
    let result = [...users];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.username && user.username.toLowerCase().includes(query)) || 
        (user.full_name && user.full_name.toLowerCase().includes(query)) || 
        (user.email && user.email.toLowerCase().includes(query))
      );
    }
    
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') { // Platform admin
        result = result.filter(user => user.role === 'admin');
      } else { // Application roles
        result = result.filter(user => user.application_role === roleFilter);
      }
    }
    
    if (statusFilter === 'blocked') {
      result = result.filter(user => user.is_blocked);
    } else if (statusFilter === 'active') {
      result = result.filter(user => !user.is_blocked);
    }
    
    setFilteredUsers(result);
  };
  
  const handleToggleBlock = async (user, action = null) => {
    setSelectedUser(user);
    const block = action === null ? !user.is_blocked : action === "block";
    setConfirmDialogOpen(true);
  };
  
  const confirmToggleBlock = async () => {
    if (!selectedUser) return;
    
    setUpdating(true);
    try {
      await User.update(selectedUser.id, { is_blocked: !selectedUser.is_blocked });
      
      // Update local state
      const updatedUsers = users.map(u => {
        if (u.id === selectedUser.id) {
          return { ...u, is_blocked: !selectedUser.is_blocked };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      setError(getTranslation(language, "errorUpdatingUser"));
    } finally {
      setUpdating(false);
      setConfirmDialogOpen(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500">
            {getTranslation(language, "loading")}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(createPageUrl("AdminDashboard"))}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {getTranslation(language, "backToDashboard")}
        </Button>
        
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          {getTranslation(language, "userManagement")}
        </h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>{getTranslation(language, "allUsers")}</CardTitle>
            <div className="flex items-center w-full md:w-auto gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={getTranslation(language, "searchUsers")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="absolute right-2 top-2.5"
                    onClick={() => setSearchQuery("")}
                  >
                    <FilterX className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <div className="px-6 py-2 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{getTranslation(language, "filters")}:</span>
            </div>
            
            <Tabs 
              value={roleFilter}
              onValueChange={setRoleFilter}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all" className="px-3 py-1 text-xs">
                  {getTranslation(language, "allRoles")}
                </TabsTrigger>
                <TabsTrigger value="admin" className="px-3 py-1 text-xs"> {/* Platform Admin */}
                  {getTranslation(language, "adminRole")} 
                </TabsTrigger>
                <TabsTrigger value="channel_owner" className="px-3 py-1 text-xs">
                  {getTranslation(language, "channelOwnerRole")}
                </TabsTrigger>
                <TabsTrigger value="advertiser" className="px-3 py-1 text-xs">
                  {getTranslation(language, "advertiserRole")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all" className="px-3 py-1 text-xs">
                  {getTranslation(language, "allStatuses")}
                </TabsTrigger>
                <TabsTrigger value="active" className="px-3 py-1 text-xs">
                  {getTranslation(language, "activeUsers")}
                </TabsTrigger>
                <TabsTrigger value="blocked" className="px-3 py-1 text-xs">
                  {getTranslation(language, "blockedUsers")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{getTranslation(language, "noUsersFound")}</p>
              {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                <Button 
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  {getTranslation(language, "clearFilters")}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getTranslation(language, "user")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getTranslation(language, "role")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getTranslation(language, "memberSince")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getTranslation(language, "status")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getTranslation(language, "actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => {
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                              {user.profile_image ? (
                                <img className="h-10 w-10 object-cover" src={user.profile_image} alt="" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                  {user.username?.charAt(0).toUpperCase() || user.full_name?.charAt(0).toUpperCase() || "U"}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username || user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={
                            user.role === "admin" ? "bg-blue-100 text-blue-800" : // Platform Admin
                            user.application_role === "channel_owner" ? "bg-purple-100 text-purple-800" : 
                            user.application_role === "advertiser" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800" // Default/User with no app role
                          }>
                            {user.role === "admin" ? getTranslation(language, `adminRole`) : 
                             user.application_role ? getTranslation(language, `${user.application_role}Role`) :
                             getTranslation(language, 'userRole') /* Basic user */}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={user.is_blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                            {getTranslation(language, user.is_blocked ? "blocked" : "active")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <Button 
                              onClick={() => navigate(createPageUrl(`AdminUserDetail?id=${user.id}`))}
                              variant="ghost"
                              size="sm"
                              title={getTranslation(language, "viewDetails")}
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            
                            {user.role !== "admin" && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className={user.is_blocked ? "text-green-500" : "text-red-500"}
                                title={getTranslation(language, user.is_blocked ? "unblock" : "block")}
                                onClick={() => handleToggleBlock(user)}
                              >
                                {user.is_blocked ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getTranslation(language, selectedUser?.is_blocked ? "confirmUnblock" : "confirmBlock")}
            </DialogTitle>
            <DialogDescription>
              {getTranslation(language, selectedUser?.is_blocked ? "unblockUserConfirmation" : "blockUserConfirmation")}
              {" "}
              <strong>{selectedUser?.username || selectedUser?.full_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={updating}>
              {getTranslation(language, "cancel")}
            </Button>
            <Button 
              variant={selectedUser?.is_blocked ? "default" : "destructive"}
              onClick={confirmToggleBlock} 
              disabled={updating}
              className={selectedUser?.is_blocked ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {updating ? getTranslation(language, "processing") : getTranslation(language, selectedUser?.is_blocked ? "unblock" : "block")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
