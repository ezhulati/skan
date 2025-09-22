// Test utility to verify short order number function works correctly
function getShortOrderNumber(fullOrderNumber) {
  const parts = fullOrderNumber.split('-');
  if (parts.length >= 3) {
    return parts[parts.length - 1];
  }
  return fullOrderNumber;
}

console.log('🧪 Testing short order number extraction...');

const testCases = [
  'SKN-20250922-007',
  'SKN-20250922-001',
  'SKN-20250922-123',
  'SKN-20241225-999',
  'INVALID-FORMAT',
  '007'
];

testCases.forEach(testCase => {
  const result = getShortOrderNumber(testCase);
  console.log(`   "${testCase}" → "${result}"`);
});

console.log('\n✅ Short order number extraction test completed!');
console.log('Customer will now see just "007" instead of "SKN-20250922-007"');
console.log('Restaurant staff can call out "Order 007 ready!" without confusion.');