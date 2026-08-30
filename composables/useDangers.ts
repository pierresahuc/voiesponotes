import type { DangerFeature, DangerFeatureCollection } from '~/types';
import type { Collections } from '@nuxt/content';
import { useRoute, useRouter } from 'vue-router';

export function useDangers(allDangerFeatures: Ref<DangerFeature[] | undefined>) {
    const route = useRoute();
    const router = useRouter();

    const showDangers = ref(false);
    const selectedSeverity = ref<Set<'low' | 'medium' | 'high'>>(new Set(['low', 'medium', 'high']));
    const selectedTags = ref<Set<string>>(new Set());

    function applyFiltersFromQuery() {
        const query = route.query;

        if (Object.hasOwn(query, 'dangers')) {
            showDangers.value = query.dangers === '1';
        }

        if (Object.hasOwn(query, 'dangerSeverity')) {
            const severitiesQuery = query.dangerSeverity as string;
            selectedSeverity.value = new Set(severitiesQuery.split(',') as ('low' | 'medium' | 'high')[]);
        }

        if (Object.hasOwn(query, 'dangerTags')) {
            const tagsQuery = query.dangerTags as string;
            selectedTags.value = new Set(tagsQuery.split(','));
        }
    }

    watch(() => route.query, applyFiltersFromQuery, { immediate: true });

    const filteredDangers = computed(() => {
        if (!showDangers.value || !allDangerFeatures.value) {
            return [];
        }

        return allDangerFeatures.value.filter((danger) => {
            // Filtre par sévérité
            if (danger.properties.severity && !selectedSeverity.value.has(danger.properties.severity)) {
                return false;
            }

            // Filtre par tags
            if (selectedTags.value.size > 0 && danger.properties.tags) {
                const hasMatchingTag = danger.properties.tags.some((tag) => selectedTags.value.has(tag));
                if (!hasMatchingTag) {
                    return false;
                }
            }

            return true;
        });
    });

    watch([showDangers, selectedSeverity, selectedTags], () => {
        const newQuery = { ...route.query };

        if (showDangers.value) {
            newQuery.dangers = '1';
        } else {
            delete newQuery.dangers;
        }

        if (selectedSeverity.value.size < 3) {
            newQuery.dangerSeverity = Array.from(selectedSeverity.value).join(',');
        } else {
            delete newQuery.dangerSeverity;
        }

        if (selectedTags.value.size > 0) {
            newQuery.dangerTags = Array.from(selectedTags.value).join(',');
        } else {
            delete newQuery.dangerTags;
        }

        void router.replace({ query: newQuery });
    }, { deep: true });

    return {
        showDangers,
        selectedSeverity,
        selectedTags,
        filteredDangers,
        toggleShowDangers: () => {
            showDangers.value = !showDangers.value;
        },
        toggleSeverity: (severity: 'low' | 'medium' | 'high') => {
            if (selectedSeverity.value.has(severity)) {
                selectedSeverity.value.delete(severity);
            } else {
                selectedSeverity.value.add(severity);
            }
        },
        toggleTag: (tag: string) => {
            if (selectedTags.value.has(tag)) {
                selectedTags.value.delete(tag);
            } else {
                selectedTags.value.add(tag);
            }
        },
    };
}