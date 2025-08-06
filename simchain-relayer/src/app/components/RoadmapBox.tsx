interface RoadmapBoxProps {
  icon: string;
  title: string;
  desc: string;
  features: string[];
}

export default function RoadmapBox({ icon, title, desc, features }: RoadmapBoxProps) {
  return (
    <div className="group p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:transform hover:scale-105">
      <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {icon} {title}
      </h3>
      <p className="text-base text-gray-600 mb-4 leading-relaxed">{desc}</p>
      <ul className="text-sm text-gray-600 space-y-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center">
            <span className="text-blue-500 mr-2">•</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
} 