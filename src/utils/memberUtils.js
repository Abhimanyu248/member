export const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const calculateDaysLeft = (expiryDate) => {
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return null;

  const today = new Date();

  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

export const getMembershipStatus = (member) => {
  const daysLeft = calculateDaysLeft(member?.expiryDate);
  if (daysLeft === null) return { label: 'Unknown', tone: 'muted', daysLeft };
  if (daysLeft < 0) return { label: 'Expired', tone: 'danger', daysLeft };
  if (daysLeft <= 4) return { label: 'Expire Soon', tone: 'warning', daysLeft };
  return { label: 'Active', tone: 'success', daysLeft };
};

export const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

export const getMemberCode = (member) => {
  const id = member?._id || member?.id || '';
  return id ? `#${String(id).slice(-5).toUpperCase()}` : '#00000';
};
