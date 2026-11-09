import { lazy, useState, useMemo } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
  paginateItems,
} from '../utils/helpers'

const PAGE_SIZE = 4
const GunDetail = lazy(() => import('../components/gun/GunDetail.jsx'))

/**
 * Catalog page — the main product listing.
 *
 * Data source priority:
 *   1. Live API via useGuns()
 *   2. Local static array (GUNS_LOCAL) when the API is unreachable
 *
 * Features: search, category filter, sort, CRUD actions, detail modal.
 */
export default function Catalog({ onNavigate }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [useLocal, setUseLocal] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // ---- API data ----
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: PAGE_SIZE,
      search,
      category: activeCategory,
      sort_by: sortKey,
      order: sortOrder,
    }),
    [currentPage, search, activeCategory, sortKey, sortOrder],
  )
  const { guns: apiGuns, loading, error, pagination, refetch } = useGuns(queryParams)

  // Decide data source
  const rawGuns = useMemo(() => {
    if (useLocal || (error && apiGuns.length === 0)) {
      // Enrich local data with synthetic ids so FavoriteButton and detail work
      return GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    }
    return apiGuns
  }, [apiGuns, error, useLocal])

  // ---- filters / sort ----
  const categories = useMemo(
    () => extractCategories([...GUNS_LOCAL, ...apiGuns]),
    [apiGuns],
  )

  const isLocalCatalog = useLocal || (error && apiGuns.length === 0)

  const filteredLocalGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  const filteredGuns = useMemo(
    () =>
      isLocalCatalog
        ? paginateItems(filteredLocalGuns, currentPage, PAGE_SIZE)
        : apiGuns,
    [apiGuns, currentPage, filteredLocalGuns, isLocalCatalog],
  )

  const pageInfo = isLocalCatalog
    ? {
        page: currentPage,
        total: filteredLocalGuns.length,
        hasMore: currentPage * PAGE_SIZE < filteredLocalGuns.length,
      }
    : pagination

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // ---- delete ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await gunService.deleteGun(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onDelete={(g) => { setSelectedGun(null); setDeleteTarget(g) }}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {isLocalCatalog
                ? `${filteredLocalGuns.length} piece${filteredLocalGuns.length !== 1 ? 's' : ''}`
                : pageInfo?.total != null
                  ? `${pageInfo.total} piece${pageInfo.total !== 1 ? 's' : ''}`
                  : `${apiGuns.length} shown`}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={(value) => { setSearch(value); setCurrentPage(1) }}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={(value) => { setActiveCategory(value); setCurrentPage(1) }}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => {
            setSortKey(key)
            setSortOrder(order)
            setCurrentPage(1)
          }}
        />

        {/* States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => { setUseLocal(true); setCurrentPage(1) }}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {/* Product grid */}
        {!loading && filteredGuns.length > 0 && (
          <ul className="stock">
            {filteredGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}

        {!loading && (currentPage > 1 || pageInfo?.hasMore) && (
          <nav className="pagination" aria-label="Catalog pagination">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span aria-live="polite">
              Page {currentPage}
              {pageInfo?.total != null && !isLocalCatalog
                ? ` of ${Math.max(1, Math.ceil(pageInfo.total / PAGE_SIZE))}`
                : ''}
            </span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!pageInfo?.hasMore}
            >
              Next
            </button>
          </nav>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); setCurrentPage(1); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
      />
      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
