const AuthPage = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <h1 className='text-4xl font-bold mb-8'>Welcome to Builder AI</h1>
      <p className='text-lg text-gray-700 mb-4'>Please sign in to continue.</p>
      <button className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300'>
        Sign In
      </button>
    </div>
  );
};

export default AuthPage;
