import React, { useState, useCallback } from 'react';
import axios from 'axios';
import FilterForm from './components/FilterForm';
import ProfileList from './components/ProfileList';
import Pagination from './components/Pagination';
import ResumeUpload from './components/ResumeUpload';
import { Profile, ProfilesResponse } from './types';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastFilters, setLastFilters] = useState<{ skills: string; experience: number; location: string; gender: string }>({
    skills: '',
    experience: 0,
    location: '',
    gender: '',
  });
  const limit = 5;

  const fetchProfiles = useCallback(async (filters: { skills: string; experience: number; location: string; gender: string }, page: number) => {
    try {
      const response = await axios.get<ProfilesResponse>(`${API_BASE}/profiles`, {
        params: { ...filters, page, limit },
      });
      setProfiles(response.data.data);
      setTotal(response.data.total);
      setCurrentPage(page);
      return response.data;
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  const handleFilter = async (filters: { skills: string; experience: number; location: string; gender: string }) => {
    setLastFilters(filters);
    await fetchProfiles(filters, 1);
  };

  const handlePageChange = async (page: number) => {
    await fetchProfiles(lastFilters, page);
  };

  const handleUploadSuccess = () => {
    fetchProfiles(lastFilters, currentPage);
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>Recruitment Tool</h1>
          <p>Search candidate profiles by skills, experience, location, and gender. Upload resumes to add candidates.</p>
        </header>
        <ResumeUpload onUploadSuccess={handleUploadSuccess} />
        <FilterForm onFilter={handleFilter} />
        <ProfileList profiles={profiles} />
        {Math.ceil(total / limit) > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(total / limit)}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}

export default App;
