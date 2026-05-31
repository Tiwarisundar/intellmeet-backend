const generateMeetingCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  
  const segment = (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Format: abc-defg-hij
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
};

module.exports = generateMeetingCode;