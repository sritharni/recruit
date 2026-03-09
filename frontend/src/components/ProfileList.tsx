import React from 'react';
import { Profile } from '../types';

interface ProfileListProps {
  profiles: Profile[];
}

const ProfileList: React.FC<ProfileListProps> = ({ profiles }) => {
  return (
    <div className="profile-list">
      <h2>Profiles</h2>
      {profiles.length === 0 ? (
        <p>No profiles found.</p>
      ) : (
        <ul>
          {profiles.map((profile) => (
            <li key={profile.id}>
              <h3>{profile.name}</h3>
              <p>Skills: {profile.skills.join(', ')}</p>
              <p>Experience: {profile.experience} years</p>
              <p>Location: {profile.location}</p>
              <p>Gender: {profile.gender}</p>
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProfileList;