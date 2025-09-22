def solve():
    n = int(input())
    recipes = {}
    for _ in range(n):
        left, right = input().split("=")
        recipes.setdefault(left, []).append(right.split("+"))
    target = input().strip()

    memo = {}
    def cost(p):
        if p not in recipes:  # base item
            return 0
        if p in memo:
            return memo[p]
        best = float("inf")
        for ing in recipes[p]:
            total = sum(cost(x) for x in ing) + (len(ing) - 1)
            best = min(best, total)
        memo[p] = best
        return best

    print(cost(target))

solve()
