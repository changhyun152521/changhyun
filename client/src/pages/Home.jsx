import Header from '../components/Header';
import Hero from '../components/Hero';
import ClassSteps from '../components/ClassSteps';
import Testimonials from '../components/Testimonials';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import YouTube from '../components/YouTube';
import Footer from '../components/Footer';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <Header />
      <Hero />
      <ClassSteps />
      <Testimonials />
      <Services />
      <Portfolio />
      <YouTube />
      <Footer />
    </div>
  );
}

export default Home;
