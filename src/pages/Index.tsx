
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Heart, Moon, Target, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: 'Activity Tracking',
      description: 'Monitor your daily steps, distance, and active minutes'
    },
    {
      icon: Heart,
      title: 'Heart Rate Analysis',
      description: 'Track heart rate zones and cardiovascular health'
    },
    {
      icon: Moon,
      title: 'Sleep Monitoring',
      description: 'Analyze sleep patterns and quality metrics'
    },
    {
      icon: BarChart3,
      title: 'Performance Charts',
      description: 'Visualize your fitness data with interactive graphs'
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Set and monitor your fitness goals and achievements'
    },
    {
      icon: TrendingUp,
      title: 'Progress Insights',
      description: 'Get detailed insights into your fitness journey'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Garmin Connect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Visualize and analyze your health and fitness data from Garmin Connect with beautiful, 
              interactive charts and comprehensive metrics tracking.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
              onClick={() => navigate('/dashboard')}
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Comprehensive Health Tracking
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get detailed insights into your fitness journey with our comprehensive dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Track Your Fitness Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start monitoring your health metrics and achieving your fitness goals today
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
            onClick={() => navigate('/dashboard')}
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
