"use client";
import FuzzyText from "./FuzzyText";

export default function NotFoundAdmin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-transparent text-white">
      <FuzzyText
        fontSize="clamp(4rem, 15vw, 20rem)"
        color="#ff5733" // A vibrant orange-red
        baseIntensity={0.2}
        hoverIntensity={0.5}
      >
        404
      </FuzzyText>
      <p className="text-xl text-gray-400 dark:text-gray-500 mt-2">
        <FuzzyText
          fontSize="1.5rem"
          color="#ff5733"
          baseIntensity={0.07}
          hoverIntensity={0.2}
        >
          Page Not Found
        </FuzzyText>
      </p>
    </div>
  );
}
