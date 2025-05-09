import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateCourse = () => {
  const [faculties, setFaculties] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    semcode: '',
    credits: 3,
    faculties: []
  });

  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/api/admin/faculty/getFaculties')
      .then(res => setFaculties(res.data))
      .catch(err => console.error("Error fetching faculties", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFacultySelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, faculties: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/courses/create', formData);
      setMsg("Course created successfully");
      setFormData({ title: '', code: '', semcode: '', credits: 3, faculties: [] });
    } catch (err) {
      console.error(err);
      setMsg("Failed to create course");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 shadow-md mt-8 rounded-md">
      <h2 className="text-xl font-semibold text-center mb-4">Create New Course</h2>
      {msg && <p className="text-center mb-4 text-sm">{msg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Course Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>

        <div>
          <label className="block text-sm">Course Code</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>

        <div>
          <label className="block text-sm">Semester Code</label>
          <input type="text" name="semcode" value={formData.semcode} onChange={handleChange} placeholder="e.g. SEM1" className="w-full p-2 border rounded" required />
        </div>

        <div>
          <label className="block text-sm">Credits</label>
          <input type="number" name="credits" value={formData.credits} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm">Assign Faculties</label>
          <select multiple value={formData.faculties} onChange={handleFacultySelect} className="w-full p-2 border rounded">
            {faculties.map(fac => (
              <option key={fac._id} value={fac._id}>{fac.name}</option>
            ))}
          </select>
          <small className="text-xs text-gray-500">Hold Ctrl (or Cmd) to select multiple</small>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Create Course
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;
