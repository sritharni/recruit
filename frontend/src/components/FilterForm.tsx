import React, { useState } from 'react';

interface FilterFormProps {
  onFilter: (filters: { skills: string; experience: number; location: string; gender: string }) => void;
}

const FilterForm: React.FC<FilterFormProps> = ({ onFilter }) => {
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState(0);
  const [location, setLocation] = useState('');
  const [gender, setGender] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ skills, experience, location, gender });
  };

  return (
    <form className="filter-form" onSubmit={handleSubmit}>
      <div>
        <label>Skills (comma separated):</label>
        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="e.g., JavaScript, React"
        />
      </div>
      <div>
        <label>Minimum Experience (years):</label>
        <input
          type="number"
          value={experience}
          onChange={(e) => setExperience(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Location:</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., New York"
        />
      </div>
      <div>
        <label>Gender:</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Any</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <button type="submit">Search</button>
    </form>
  );
};

export default FilterForm;