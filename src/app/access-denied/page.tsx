export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">접근 거부됨</h1>
        <p className="text-gray-700 mb-4">
          귀하의 계정은 아직 관리자의 승인을 기다리고 있습니다.
        </p>
        <p className="text-gray-700">
          승인되면 모든 기능에 접근할 수 있습니다.
        </p>
      </div>
    </div>
  );
}