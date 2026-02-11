const Incompatible: React.FC = () => (
	<div className="card-container">
		<div
			className="bg-white px-6 pt-6 rounded-xl shadow-lg text-center border-2
  border-gray-400 space-y-5 mt-8 w-full
  flex flex-col h-full"
		>
			<h2 className="minnie-title text-2xl">
        Oops! Your session is incompatible.
			</h2>
			<div className="text-xl space-y-2">
				<p>
          ToonScout cannot function on the Safari browser or on mobile devices.
				</p>
				<p>
          Please use a different browser or enter the website on the same device
          you're running Toontown on!
				</p>
			</div>
		</div>
	</div>
);

export default Incompatible;
