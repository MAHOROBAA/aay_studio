import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout/AppLayout'
import LandingPage from '../pages/LandingPage'
import HomePage from '../pages/HomePage'
import CreateMethodPage from '../pages/CreateMethodPage'
import CreateStoryPage from '../pages/CreateStoryPage'
import CreateStorySetupPage from '../pages/CreateStorySetupPage'
import CreateFreePage from '../pages/CreateFreePage'
import CreateFreeBriefPage from '../pages/CreateFreeBriefPage'
import CreateSettingsPage from '../pages/CreateSettingsPage'
import CreateGeneratingPage from '../pages/CreateGeneratingPage'
import CreateReviewPage from '../pages/CreateReviewPage'
import CreatePublishPage from '../pages/CreatePublishPage'
import LibraryVideosPage from '../pages/LibraryVideosPage'
import LibraryVideoDetailPage from '../pages/LibraryVideoDetailPage'
import LibraryCharactersPage from '../pages/LibraryCharactersPage'
import LibraryCharacterDetailPage from '../pages/LibraryCharacterDetailPage'
import LibraryWorldsPage from '../pages/LibraryWorldsPage'
import LibraryWorldDetailPage from '../pages/LibraryWorldDetailPage'
import LibraryWorldFormPage from '../pages/LibraryWorldFormPage'
import LibraryStoriesPage from '../pages/LibraryStoriesPage'
import LibraryStoryDetailPage from '../pages/LibraryStoryDetailPage'
import LibraryStoryFormPage from '../pages/LibraryStoryFormPage'
import MyPage from '../pages/MyPage'
import MyPageCreditHistoryPage from '../pages/MyPageCreditHistoryPage'
import MyPageCreditChargePage from '../pages/MyPageCreditChargePage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/create" element={<CreateMethodPage />} />
          <Route path="/create/story" element={<CreateStoryPage />} />
          <Route path="/create/story/setup" element={<CreateStorySetupPage />} />
          <Route path="/create/free" element={<CreateFreePage />} />
          <Route path="/create/free/brief" element={<CreateFreeBriefPage />} />
          <Route path="/create/settings" element={<CreateSettingsPage />} />
          <Route path="/create/generating" element={<CreateGeneratingPage />} />
          <Route path="/create/review" element={<CreateReviewPage />} />
          <Route path="/create/publish" element={<CreatePublishPage />} />
          <Route path="/library" element={<Navigate to="/library/videos" replace />} />
          <Route path="/library/videos" element={<LibraryVideosPage />} />
          <Route path="/library/videos/:videoId" element={<LibraryVideoDetailPage />} />
          <Route path="/library/characters" element={<LibraryCharactersPage />} />
          <Route path="/library/characters/:characterId" element={<LibraryCharacterDetailPage />} />
          <Route path="/library/worlds" element={<LibraryWorldsPage />} />
          <Route path="/library/worlds/new" element={<LibraryWorldFormPage />} />
          <Route path="/library/worlds/:worldId" element={<LibraryWorldDetailPage />} />
          <Route path="/library/worlds/:worldId/edit" element={<LibraryWorldFormPage />} />
          <Route path="/library/stories" element={<LibraryStoriesPage />} />
          <Route path="/library/stories/new" element={<LibraryStoryFormPage />} />
          <Route path="/library/stories/:storyId" element={<LibraryStoryDetailPage />} />
          <Route path="/library/stories/:storyId/edit" element={<LibraryStoryFormPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/credits" element={<MyPageCreditHistoryPage />} />
          <Route path="/mypage/credits/charge" element={<MyPageCreditChargePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
