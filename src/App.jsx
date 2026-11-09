import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import GUNS_LOCAL from './data/guns.js'
import './App.css'

const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))

const clearGunShareParam = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('gun')
  window.history.replaceState(window.history.state, '', url)
}

function App() {
  const [sharedGunId] = useState(
    () => new URLSearchParams(window.location.search).get('gun'),
  )
  const localIndex = /^local-\d+$/.test(sharedGunId || '')
    ? Number(sharedGunId.slice('local-'.length))
    : -1
  const localSharedGun = localIndex >= 0 ? GUNS_LOCAL[localIndex] : null
  const invalidLocalShare = localIndex >= 0 && !localSharedGun
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState(
    sharedGunId && !invalidLocalShare ? 'detail' : 'list',
  ) // 'list' | 'create' | 'edit' | 'detail'
  const [selectedGun, setSelectedGun] = useState(
    localSharedGun ? { ...localSharedGun, id: sharedGunId } : null,
  )
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sharedLinkError, setSharedLinkError] = useState(
    invalidLocalShare ? 'This catalog share link does not match an item.' : '',
  )

  useEffect(() => {
    if (!sharedGunId || localIndex >= 0) return

    let active = true
    gunService.getGunById(sharedGunId)
      .then((response) => {
        if (!active) return
        if (!response?.success || !response.data) {
          throw new Error('The shared catalog item could not be found.')
        }
        setSelectedGun(response.data)
      })
      .catch((error) => {
        if (!active) return
        setMode('list')
        setSharedLinkError(error.message || 'The shared catalog item could not be loaded.')
      })

    return () => { active = false }
  }, [sharedGunId, localIndex])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target !== 'Detail') clearGunShareParam()

    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    clearGunShareParam()
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        {sharedLinkError && <p className="form-error" role="alert">{sharedLinkError}</p>}
        <Suspense fallback={<div className="state-box" role="status">Loading page…</div>}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'detail' && (
            selectedGun ? (
              <GunDetail
                gun={selectedGun}
                onBack={handleBackToList}
                onEdit={(g) => handleNavigate('Edit', g)}
                onDelete={(g) => setDeleteTarget(g)}
              />
            ) : (
              <div className="state-box" role="status">Loading shared catalog item…</div>
            )
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Profile' && (
                <ProfilePage onReplaySplash={() => setShowSplash(true)} />
              )}
              {tab === 'About' && <About />}
              {tab === 'Contact' && <Contact />}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Hardware Record"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await gunService.deleteGun(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to delete record.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
