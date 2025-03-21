import { useState, useEffect } from 'react';
import axios from 'axios';

const UnitConverter = () => {
  const [formulaData, setFormulaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [fromValue, setFromValue] = useState('');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [result, setResult] = useState(null);
  const [recentConversions, setRecentConversions] = useState([]);
  
  // Dropdown states
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchFormulas = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/formula.json');
        setFormulaData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching formula data:', error);
        setError('Failed to load conversion data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFormulas();
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setFromDropdownOpen(false);
        setToDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = formulaData ? Object.keys(formulaData) : [];

  const handleCalculate = () => {
    if (!selectedCategory || !fromValue || !fromUnit || !toUnit) {
      setError('Please fill in all fields to perform a conversion');
      return;
    }

    setError(null);
    let calculatedResult;
    const value = parseFloat(fromValue);

    try {
      if (selectedCategory === 'temperature') {
        const formula = `${formulaData[selectedCategory].units[fromUnit]}_to_${formulaData[selectedCategory].units[toUnit]}`;
        if (formulaData[selectedCategory].formula[formula]) {
          // Using Function instead of eval for better security
          const calculateFormula = new Function('value', `return ${formulaData[selectedCategory].formula[formula].replace('value', 'value')}`);
          calculatedResult = calculateFormula(value);
        }
      } else if (formulaData[selectedCategory].formula) {
        // Handle categories with specific formulas
        const formula = `${fromUnit}_to_${toUnit}`;
        if (formulaData[selectedCategory].formula[formula]) {
          const calculateFormula = new Function('value', `return ${formulaData[selectedCategory].formula[formula].replace('value', 'value')}`);
          calculatedResult = calculateFormula(value);
        } else {
          // Try reverse formula if direct formula not found
          const reverseFormula = `${toUnit}_to_${fromUnit}`;
          if (formulaData[selectedCategory].formula[reverseFormula]) {
            const calculateReverseFormula = new Function('value', `return ${formulaData[selectedCategory].formula[reverseFormula].replace('value', 'value')}`);
            const intermediateResult = calculateReverseFormula(1);
            calculatedResult = value / intermediateResult;
          } else {
            // If no specific formula found, use unit ratios
            const fromUnitValue = formulaData[selectedCategory].units[fromUnit];
            const toUnitValue = formulaData[selectedCategory].units[toUnit];
            calculatedResult = value * (toUnitValue / fromUnitValue);
          }
        }
      } else {
        // Handle simple unit conversions using ratios
        const fromUnitValue = formulaData[selectedCategory].units[fromUnit];
        const toUnitValue = formulaData[selectedCategory].units[toUnit];
        calculatedResult = value * (toUnitValue / fromUnitValue);
      }
      
      // Using Math.ceil as requested
      const ceiledResult = Math.ceil(calculatedResult * 10000) / 10000;
      setResult(ceiledResult);
      
      // Add to recent conversions
      const newConversion = {
        id: Date.now(),
        category: selectedCategory,
        fromValue,
        fromUnit,
        toValue: ceiledResult,
        toUnit,
        timestamp: new Date()
      };
      
      setRecentConversions(prev => [newConversion, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Calculation error:', error);
      setError('An error occurred during calculation. Please check your inputs.');
    }
  };

  const resetForm = () => {
    setFromValue('');
    setResult(null);
    setFromUnit('');
    setToUnit('');
    setError(null);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    resetForm();
  };

  const formatUnitName = (unitName) => {
    return unitName.replace(/_/g, ' ');
  };
  
  // Custom dropdown selection handlers
  const handleFromUnitSelect = (unit) => {
    setFromUnit(unit);
    setFromDropdownOpen(false);
  };
  
  const handleToUnitSelect = (unit) => {
    setToUnit(unit);
    setToDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nav"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-playfair">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-nav">Unit Converter</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Select Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-none text-sm font-medium capitalize transition-colors duration-200 ${
                  selectedCategory === category
                    ? 'bg-nav text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Conversion Form */}
        <div className="bg-white shadow-md rounded-none p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* From Section */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">From</label>
              <div className="mb-4">
                <input
                  type="number"
                  value={fromValue}
                  onChange={(e) => setFromValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-none py-3 px-4 focus:outline-none focus:ring-2 focus:ring-nav focus:border-transparent"
                  placeholder="Enter value"
                />
              </div>
              
              {selectedCategory && formulaData && (
                <div className="dropdown-container relative">
                  <button 
                    type="button"
                    onClick={() => setFromDropdownOpen(!fromDropdownOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-nav focus:border-transparent"
                  >
                    <span className="block truncate">
                      {fromUnit ? formatUnitName(fromUnit) : "Select unit"}
                    </span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${fromDropdownOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {fromDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto focus:outline-none">
                      {Object.keys(formulaData[selectedCategory].units).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => handleFromUnitSelect(unit)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${fromUnit === unit ? 'bg-blue-50 text-nav font-medium' : 'text-gray-900'}`}
                        >
                          {formatUnitName(unit)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* To Section */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">To</label>
              <div className="mb-4">
                <input
                  type="text"
                  value={result !== null ? result : ''}
                  readOnly
                  className="w-full border border-gray-200 rounded-none py-3 px-4 bg-gray-50"
                  placeholder="Result"
                />
              </div>
              
              {selectedCategory && formulaData && (
                <div className="dropdown-container relative">
                  <button 
                    type="button"
                    onClick={() => setToDropdownOpen(!toDropdownOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-nav focus:border-transparent"
                  >
                    <span className="block truncate">
                      {toUnit ? formatUnitName(toUnit) : "Select unit"}
                    </span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${toDropdownOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {toDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto focus:outline-none">
                      {Object.keys(formulaData[selectedCategory].units).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => handleToUnitSelect(unit)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${toUnit === unit ? 'bg-blue-50 text-nav font-medium' : 'text-gray-900'}`}
                        >
                          {formatUnitName(unit)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center mt-8 gap-4">
            <button
              onClick={handleCalculate}
              disabled={!selectedCategory || !fromValue || !fromUnit || !toUnit}
              className="bg-nav hover:bg-nav-dark text-white font-medium py-3 px-8 rounded-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Convert
            </button>
            
            <button
              onClick={resetForm}
              className="border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium py-3 px-8 rounded-none transition-colors duration-200 shadow-sm"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Result Display */}
        {result !== null && (
          <div className="bg-white shadow-md rounded-none p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Conversion Result</h2>
            <div className="p-4 bg-gray-50 rounded-none">
              <p className="text-2xl font-bold">
                {fromValue} <span className="text-nav">{formatUnitName(fromUnit)}</span> = {result} <span className="text-nav">{formatUnitName(toUnit)}</span>
              </p>
            </div>
          </div>
        )}
        
        {/* Recent Conversions */}
        {recentConversions.length > 0 && (
          <div className="bg-white shadow-md rounded-none p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Conversions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentConversions.map((conversion) => (
                    <tr key={conversion.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{formatUnitName(conversion.category)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {conversion.fromValue} {formatUnitName(conversion.fromUnit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {conversion.toValue} {formatUnitName(conversion.toUnit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {conversion.timestamp.toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitConverter;