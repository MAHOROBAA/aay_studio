import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout/AppLayout'
import LandingPage from '../pages/LandingPage'
import HomePage from '../pages/HomePage'
import CreateMethodPage from '../pages/CreateMethodPage'
import CreateTemplatePage from '../pages/CreateTemplatePage'
import CreateTemplateSetupPage from '../pages/CreateTemplateSetupPage'
import CreateManualPage from '../pages/CreateManualPage'
import CreateManualBriefPage from '../pages/CreateManualBriefPage'
import CreateSettingsPage from '../pages/CreateSettingsPage'
import CreateGeneratingPage from '../pages/CreateGeneratingPage'
import CreateReviewPage from '../pages/CreateReviewPage'
import CreatePublishPage from '../pages/CreatePublishPage'
import LibraryPage from '../pages/LibraryPage'
import LibraryDetailPage from '../pages/LibraryDetailPage'
import MyPage from '../pages/MyPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/create" element={<CreateMethodPage />} />
          <Route path="/create/template" element={<CreateTemplatePage />} />
          <Route path="/create/template/setup" element={<CreateTemplateSetupPage />} />
          <Route path="/create/manual" element={<CreateManualPage />} />
          <Route path="/create/manual/brief" element={<CreateManualBriefPage />} />
          <Route path="/create/settings" element={<CreateSettingsPage />} />
          <Route path="/create/generating" element={<CreateGeneratingPage />} />
          <Route path="/create/review" element={<CreateReviewPage />} />
          <Route path="/create/publish" element={<CreatePublishPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:videoId" element={<LibraryDetailPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
