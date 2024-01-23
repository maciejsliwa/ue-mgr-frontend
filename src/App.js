import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button, ThemeProvider, createTheme } from '@mui/material';
import './App.css';

const generateEmoticons = () => {
  const emoticons = ['😊', '☹️'];
  return emoticons[Math.floor(Math.random() * emoticons.length)];
};

const Calendar = ({ days }) => {
  return (
      <div className="calendar">
        {days.map((day, index) => (
            <div key={index} className={`day ${day.isVisible ? '' : 'inactive'}`}>
              <div className="day-number">{day.number}</div>
              <div className="emoticon">{day.emoticon}</div>
            </div>
        ))}
      </div>
  );
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [dateRange, setDateRange] = useState({ min: '', max: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/calender/range');
        const data = await response.json();
        setDateRange(data);
      } catch (error) {
        console.error('Error fetching data from API:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const generateCalendarData = () => {
      const daysInMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0
      ).getDate();

      const startDate = new Date(dateRange.min);
      const endDate = new Date(dateRange.max);

      const data = Array.from({ length: daysInMonth }, (_, index) => {
        const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1);
        const isVisible = currentDate >= startDate && currentDate <= endDate;
        return {
          number: index + 1,
          date: currentDate,
          isVisible,
          emoticon: isVisible ? generateEmoticons() : null,
        };
      });

      setCalendarData(data);
    };

    generateCalendarData();
  }, [currentMonth, dateRange]);

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  return (
      <ThemeProvider theme={darkTheme}>
        <div className="App">
          <h1>Interaktywny Kalendarz z Emotikonami</h1>
          <div className="calendar-header">
            <Button onClick={handlePrevMonth} variant="contained">
              &lt; Poprzedni Miesiąc
            </Button>
            <h2>{format(currentMonth, 'LLLL yyyy')}</h2>
            <Button onClick={handleNextMonth} variant="contained">
              Następny Miesiąc &gt;
            </Button>
          </div>
          <Calendar days={calendarData} />
        </div>
      </ThemeProvider>
  );
};

export default App;
